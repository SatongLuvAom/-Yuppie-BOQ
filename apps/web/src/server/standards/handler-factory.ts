import type { OrganizationAuthorizationContext } from "@yuppie/auth";
import type {
  AddStandardEvidenceRequest,
  ApproveStandardVersionRequest,
  CreateStandardRequest,
  CreateStandardVersionRequest,
  RejectStandardVersionRequest,
  RetireStandardVersionRequest,
  StandardsActorContext,
  StandardsMutationReceipt,
  StandardsService,
  StandardsServiceErrorCode,
  SubmitStandardForReviewRequest,
  UpdateDraftVersionRequest,
  UpdateStandardRequest
} from "@yuppie/domain";
import {
  addStandardEvidenceRequestSchema,
  approveStandardVersionRequestSchema,
  createStandardRequestSchema,
  createStandardVersionRequestSchema,
  rejectStandardVersionRequestSchema,
  retireStandardVersionRequestSchema,
  submitStandardForReviewRequestSchema,
  updateDraftVersionRequestSchema,
  updateStandardRequestSchema,
  type ValidationIssue,
  type ValidationSchema
} from "@yuppie/validation";

import type { ActorResolutionErrorCode } from "./actor";

export type StandardsApiErrorCode =
  | StandardsServiceErrorCode
  | ActorResolutionErrorCode
  | "unauthorized";

export interface StandardsApiError {
  readonly code: StandardsApiErrorCode;
  readonly message: string;
  readonly details?: readonly {
    readonly field: string;
    readonly message: string;
  }[];
}

export type StandardsActionResponse<T> =
  | { readonly data: T }
  | { readonly error: StandardsApiError };

type MutationResponse = StandardsActionResponse<StandardsMutationReceipt>;

export type StandardsActorResolution =
  | { readonly data: OrganizationAuthorizationContext }
  | {
      readonly error: {
        readonly code: ActorResolutionErrorCode;
        readonly message: string;
      };
    };

export interface StandardsActionDependencies {
  readonly service: StandardsService;
  resolveActor(organizationId: string): Promise<StandardsActorResolution>;
}

export interface StandardsActionHandlers {
  createStandard(input: unknown): Promise<MutationResponse>;
  updateStandard(input: unknown): Promise<MutationResponse>;
  createVersion(input: unknown): Promise<MutationResponse>;
  updateDraftVersion(input: unknown): Promise<MutationResponse>;
  addEvidence(input: unknown): Promise<MutationResponse>;
  submitForReview(input: unknown): Promise<MutationResponse>;
  approveVersion(input: unknown): Promise<MutationResponse>;
  rejectVersion(input: unknown): Promise<MutationResponse>;
  retireVersion(input: unknown): Promise<MutationResponse>;
}

function validationFailure(
  issues: readonly ValidationIssue[]
): MutationResponse {
  return {
    error: {
      code: "validation_failed",
      message: "The request is invalid.",
      details: issues.map(({ path, message }) => ({
        field: path,
        message
      }))
    }
  };
}

function unexpectedFailure(): MutationResponse {
  return {
    error: {
      code: "unexpected_error",
      message: "The standards operation could not be completed."
    }
  };
}

function toServiceActor(
  authorization: OrganizationAuthorizationContext
): StandardsActorContext {
  return {
    organizationId: authorization.organizationId,
    membershipId: authorization.membershipId,
    roles: authorization.membershipRoles
  };
}

export function createStandardsActionHandlers(
  dependencies: StandardsActionDependencies
): StandardsActionHandlers {
  const run = async <TRequest extends { readonly organizationId: string }>(
    input: unknown,
    schema: ValidationSchema<TRequest>,
    operation: (
      actor: StandardsActorContext,
      request: TRequest
    ) => ReturnType<StandardsService["createStandard"]>
  ): Promise<MutationResponse> => {
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      return validationFailure(parsed.issues);
    }

    try {
      const actor = await dependencies.resolveActor(parsed.data.organizationId);

      if ("error" in actor) {
        return { error: actor.error };
      }

      const result = await operation(toServiceActor(actor.data), parsed.data);
      return result.ok ? { data: result.data } : { error: result.error };
    } catch {
      return unexpectedFailure();
    }
  };

  return {
    createStandard: (input) =>
      run<CreateStandardRequest>(input, createStandardRequestSchema, (actor, request) =>
        dependencies.service.createStandard(actor, request)
      ),
    updateStandard: (input) =>
      run<UpdateStandardRequest>(input, updateStandardRequestSchema, (actor, request) =>
        dependencies.service.updateStandard(actor, request)
      ),
    createVersion: (input) =>
      run<CreateStandardVersionRequest>(
        input,
        createStandardVersionRequestSchema,
        (actor, request) => dependencies.service.createVersion(actor, request)
      ),
    updateDraftVersion: (input) =>
      run<UpdateDraftVersionRequest>(
        input,
        updateDraftVersionRequestSchema,
        (actor, request) =>
          dependencies.service.updateDraftVersion(actor, request)
      ),
    addEvidence: (input) =>
      run<AddStandardEvidenceRequest>(
        input,
        addStandardEvidenceRequestSchema,
        (actor, request) => dependencies.service.addEvidence(actor, request)
      ),
    submitForReview: (input) =>
      run<SubmitStandardForReviewRequest>(
        input,
        submitStandardForReviewRequestSchema,
        (actor, request) => dependencies.service.submitForReview(actor, request)
      ),
    approveVersion: (input) =>
      run<ApproveStandardVersionRequest>(
        input,
        approveStandardVersionRequestSchema,
        (actor, request) => dependencies.service.approveVersion(actor, request)
      ),
    rejectVersion: (input) =>
      run<RejectStandardVersionRequest>(
        input,
        rejectStandardVersionRequestSchema,
        (actor, request) => dependencies.service.rejectVersion(actor, request)
      ),
    retireVersion: (input) =>
      run<RetireStandardVersionRequest>(
        input,
        retireStandardVersionRequestSchema,
        (actor, request) => dependencies.service.retireVersion(actor, request)
      )
  };
}
