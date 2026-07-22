import type { EntityId, MembershipRole } from "./contracts";
import {
  validateApprovalMembership,
  validateIndependentReviewerMembership,
  validateReviewDecisionMembership,
  validateReviewRejection,
  validateReviewSubmission,
  validateRetirement,
  validateStandardLifecycleTransition,
  validateStandardVersionEdit,
  type DomainRuleViolation
} from "./rules";
import type {
  AddStandardEvidenceRequest,
  ApproveStandardVersionRequest,
  CreateStandardRequest,
  CreateStandardVersionRequest,
  RejectStandardVersionRequest,
  RetireStandardVersionRequest,
  StandardsActorContext,
  StandardsMutationReceipt,
  StandardsRepository,
  StandardsServiceError,
  StandardsServiceResult,
  SubmitStandardForReviewRequest,
  UpdateDraftVersionRequest,
  UpdateStandardRequest
} from "./standards-service-contracts";

type MutationResult = Promise<StandardsServiceResult<StandardsMutationReceipt>>;

export interface StandardsService {
  createStandard(
    actor: StandardsActorContext,
    input: CreateStandardRequest
  ): MutationResult;
  updateStandard(
    actor: StandardsActorContext,
    input: UpdateStandardRequest
  ): MutationResult;
  createVersion(
    actor: StandardsActorContext,
    input: CreateStandardVersionRequest
  ): MutationResult;
  updateDraftVersion(
    actor: StandardsActorContext,
    input: UpdateDraftVersionRequest
  ): MutationResult;
  addEvidence(
    actor: StandardsActorContext,
    input: AddStandardEvidenceRequest
  ): MutationResult;
  submitForReview(
    actor: StandardsActorContext,
    input: SubmitStandardForReviewRequest
  ): MutationResult;
  approveVersion(
    actor: StandardsActorContext,
    input: ApproveStandardVersionRequest
  ): MutationResult;
  rejectVersion(
    actor: StandardsActorContext,
    input: RejectStandardVersionRequest
  ): MutationResult;
  retireVersion(
    actor: StandardsActorContext,
    input: RetireStandardVersionRequest
  ): MutationResult;
}

function failure(error: StandardsServiceError): StandardsServiceResult<never> {
  return { ok: false, error };
}

function firstViolation(
  violations: readonly DomainRuleViolation[]
): StandardsServiceResult<never> | undefined {
  const violation = violations[0];
  return violation ? failure(violation) : undefined;
}

function validateActor(
  actor: StandardsActorContext,
  organizationId: EntityId,
  requiredRole: MembershipRole
): StandardsServiceResult<never> | undefined {
  if (actor.organizationId !== organizationId) {
    return failure({
      code: "organization_scope_mismatch",
      message: "The request organization does not match the authenticated membership."
    });
  }

  if (!actor.roles.includes(requiredRole)) {
    return failure({
      code:
        requiredRole === "standards_editor"
          ? "standards_editor_role_required"
          : "standards_approver_role_required",
      message:
        requiredRole === "standards_editor"
          ? "A Standards Editor role is required."
          : "A Standards Approver role is required."
    });
  }

  return undefined;
}

async function safelyMutate(
  mutation: () => MutationResult
): MutationResult {
  try {
    return await mutation();
  } catch {
    return failure({
      code: "unexpected_error",
      message: "The standards operation could not be completed."
    });
  }
}

export function createStandardsService(
  repository: StandardsRepository
): StandardsService {
  const editorMutation = <T extends { readonly organizationId: EntityId }>(
    actor: StandardsActorContext,
    input: T,
    mutation: () => MutationResult
  ): MutationResult => {
    const actorFailure = validateActor(
      actor,
      input.organizationId,
      "standards_editor"
    );
    return actorFailure
      ? Promise.resolve(actorFailure)
      : safelyMutate(mutation);
  };

  return {
    createStandard: (actor, input) =>
      editorMutation(actor, input, () => repository.createStandard(input)),

    updateStandard: (actor, input) =>
      editorMutation(actor, input, () => repository.updateStandard(input)),

    createVersion: (actor, input) =>
      editorMutation(actor, input, () => repository.createVersion(input)),

    updateDraftVersion: async (actor, input) => {
      const actorFailure = validateActor(
        actor,
        input.organizationId,
        "standards_editor"
      );
      if (actorFailure) return actorFailure;

      const context = await repository.getVersionMutationContext(input);
      if (!context.ok) return context;

      const ruleFailure = firstViolation(
        validateStandardVersionEdit(context.data.status)
      );
      return ruleFailure ?? safelyMutate(() => repository.updateDraftVersion(input));
    },

    addEvidence: async (actor, input) => {
      const actorFailure = validateActor(
        actor,
        input.organizationId,
        "standards_editor"
      );
      if (actorFailure) return actorFailure;

      const context = await repository.getVersionMutationContext(input);
      if (!context.ok) return context;

      const ruleFailure = firstViolation(
        validateStandardVersionEdit(context.data.status)
      );
      return ruleFailure ?? safelyMutate(() => repository.addEvidence(input));
    },

    submitForReview: async (actor, input) => {
      const actorFailure = validateActor(
        actor,
        input.organizationId,
        "standards_editor"
      );
      if (actorFailure) return actorFailure;

      const context = await repository.getVersionMutationContext(input);
      if (!context.ok) return context;

      const ruleFailure = firstViolation([
        ...validateStandardLifecycleTransition(context.data.status, "review"),
        ...validateReviewSubmission(context.data),
        ...validateIndependentReviewerMembership({
          reviewerMembershipId: input.reviewerMembershipId,
          createdByMembershipId: context.data.createdByMembershipId,
          editorMembershipIds: context.data.editorMembershipIds
        })
      ]);
      return ruleFailure ?? safelyMutate(() => repository.submitForReview(input));
    },

    approveVersion: async (actor, input) => {
      const actorFailure = validateActor(
        actor,
        input.organizationId,
        "standards_approver"
      );
      if (actorFailure) return actorFailure;

      const context = await repository.getVersionMutationContext(input);
      if (!context.ok) return context;

      const ruleFailure = firstViolation([
        ...validateStandardLifecycleTransition(context.data.status, "approved"),
        ...validateApprovalMembership({
          actorMembershipId: actor.membershipId,
          actorRoles: actor.roles,
          createdByMembershipId: context.data.createdByMembershipId,
          editorMembershipIds: context.data.editorMembershipIds,
          reviewerMembershipId: context.data.reviewerMembershipId ?? ""
        })
      ]);
      return ruleFailure ?? safelyMutate(() => repository.approveVersion(input));
    },

    rejectVersion: async (actor, input) => {
      const actorFailure = validateActor(
        actor,
        input.organizationId,
        "standards_approver"
      );
      if (actorFailure) return actorFailure;

      const context = await repository.getVersionMutationContext(input);
      if (!context.ok) return context;

      const ruleFailure = firstViolation([
        ...validateStandardLifecycleTransition(context.data.status, "draft"),
        ...validateReviewDecisionMembership({
          actorMembershipId: actor.membershipId,
          actorRoles: actor.roles,
          reviewerMembershipId: context.data.reviewerMembershipId ?? ""
        }),
        ...validateReviewRejection(input.rationale)
      ]);
      return ruleFailure ?? safelyMutate(() => repository.rejectVersion(input));
    },

    retireVersion: async (actor, input) => {
      const actorFailure = validateActor(
        actor,
        input.organizationId,
        "standards_approver"
      );
      if (actorFailure) return actorFailure;

      const context = await repository.getVersionMutationContext(input);
      if (!context.ok) return context;

      const ruleFailure = firstViolation([
        ...validateStandardLifecycleTransition(context.data.status, "retired"),
        ...validateRetirement(actor.roles, input.rationale)
      ]);
      return ruleFailure ?? safelyMutate(() => repository.retireVersion(input));
    }
  };
}
