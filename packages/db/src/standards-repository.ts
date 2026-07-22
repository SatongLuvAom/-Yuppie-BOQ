import type {
  AddStandardEvidenceRequest,
  ApproveStandardVersionRequest,
  CreateStandardRequest,
  CreateStandardVersionRequest,
  RejectStandardVersionRequest,
  RetireStandardVersionRequest,
  StandardKind,
  StandardLifecycleStatus,
  StandardsMutationReceipt,
  StandardsRepository,
  StandardsRepositoryResult,
  StandardsServiceError,
  SubmitStandardForReviewRequest,
  UpdateDraftVersionRequest,
  UpdateStandardRequest,
  StandardVersionMutationContext
} from "@yuppie/domain";

export interface SupabaseRpcError {
  readonly code?: string;
  readonly message: string;
  readonly details?: string;
  readonly hint?: string;
}

export interface AuthenticatedSupabaseRpcClient {
  rpc(
    functionName: string,
    parameters: Readonly<Record<string, unknown>>
  ): PromiseLike<{
    readonly data: unknown;
    readonly error: SupabaseRpcError | null;
  }>;
}

type JsonObject = Readonly<Record<string, unknown>>;

const RPC = {
  getContext: "standards_get_version_mutation_context",
  createStandard: "standards_create_standard",
  updateStandard: "standards_update_standard",
  createVersion: "standards_create_version",
  updateDraftVersion: "standards_update_draft_version",
  addEvidence: "standards_add_evidence",
  submitForReview: "standards_submit_for_review",
  approveVersion: "standards_approve_version",
  rejectVersion: "standards_reject_version",
  retireVersion: "standards_retire_version"
} as const;

function failure<T>(error: StandardsServiceError): StandardsRepositoryResult<T> {
  return { ok: false, error };
}

function mapRpcError(error: SupabaseRpcError): StandardsServiceError {
  const message = `${error.message} ${error.details ?? ""}`.toLowerCase();

  if (error.code === "42501" || message.includes("row-level security")) {
    return { code: "forbidden", message: "The authenticated membership cannot perform this operation." };
  }
  if (error.code === "23505") {
    return { code: "conflict", message: "The standards operation conflicts with current data." };
  }
  if (message.includes("kind mismatch")) {
    return { code: "conflict", message: "The standard kind conflicts with current data." };
  }
  if (error.code === "PGRST116" || message.includes("not found")) {
    return { code: "not_found", message: "The requested standards record was not found." };
  }
  if (message.includes("creator or editor cannot")) {
    return { code: "self_approval_forbidden", message: "A creator or editor cannot approve the same version." };
  }
  if (message.includes("assigned independent reviewer")) {
    return { code: "assigned_reviewer_required", message: "Only the assigned independent reviewer may decide the version." };
  }
  if (message.includes("evidence")) {
    return { code: "evidence_required", message: "Evidence is required for this standards operation." };
  }
  if (
    message.includes("active draft version") ||
    message.includes("editable only while draft")
  ) {
    return { code: "version_not_editable", message: "Only Draft versions can be edited." };
  }
  if (
    message.includes("immutable") ||
    message.includes("cannot be edited") ||
    message.includes("editable only while draft")
  ) {
    return { code: "immutable_version", message: "Approved and retired versions cannot be edited." };
  }
  if (message.includes("only draft versions are editable")) {
    return { code: "version_not_editable", message: "Only draft versions are editable." };
  }
  if (
    message.includes("lifecycle transition") ||
    message.includes("only a review version") ||
    message.includes("only an approved version")
  ) {
    return { code: "invalid_lifecycle_transition", message: "The requested lifecycle transition is not allowed." };
  }
  if (message.includes("role") || message.includes("permission")) {
    return { code: "forbidden", message: "The authenticated membership cannot perform this operation." };
  }

  return { code: "database_error", message: "The standards data operation failed." };
}

function asObject(data: unknown): JsonObject | undefined {
  const value = Array.isArray(data) ? data[0] : data;
  return typeof value === "object" && value !== null
    ? (value as JsonObject)
    : undefined;
}

function requiredString(data: JsonObject, key: string): string | undefined {
  const value = data[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalString(data: JsonObject, key: string): string | undefined {
  const value = data[key];
  return value === null || value === undefined
    ? undefined
    : requiredString(data, key);
}

function parseKind(value: unknown): StandardKind | undefined {
  return value === "material" || value === "labor" || value === "work_method"
    ? value
    : undefined;
}

function parseStatus(value: unknown): StandardLifecycleStatus | undefined {
  return value === "draft" ||
    value === "review" ||
    value === "approved" ||
    value === "retired"
    ? value
    : undefined;
}

function parseReceipt(data: unknown): StandardsMutationReceipt | undefined {
  const object = asObject(data);
  if (!object) return undefined;

  const organizationId = requiredString(object, "organization_id");
  const standardKind = parseKind(object.standard_kind);
  const standardId = requiredString(object, "standard_id");
  const auditLogId = requiredString(object, "audit_log_id");
  if (!organizationId || !standardKind || !standardId || !auditLogId) {
    return undefined;
  }

  const versionNumber = object.version_number;
  return {
    organizationId,
    standardKind,
    standardId,
    auditLogId,
    ...(optionalString(object, "standard_version_id")
      ? { standardVersionId: optionalString(object, "standard_version_id") }
      : {}),
    ...(Number.isSafeInteger(versionNumber)
      ? { versionNumber: Number(versionNumber) }
      : {}),
    ...(parseStatus(object.status) ? { status: parseStatus(object.status) } : {}),
    ...(optionalString(object, "evidence_id")
      ? { evidenceId: optionalString(object, "evidence_id") }
      : {}),
    ...(optionalString(object, "approval_id")
      ? { approvalId: optionalString(object, "approval_id") }
      : {})
  };
}

function stringArray(value: unknown): readonly string[] | undefined {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
    ? value
    : undefined;
}

function parseContext(
  data: unknown
): StandardVersionMutationContext | undefined {
  const object = asObject(data);
  if (!object) return undefined;

  const organizationId = requiredString(object, "organization_id");
  const standardKind = parseKind(object.standard_kind);
  const standardId = requiredString(object, "standard_id");
  const standardVersionId = requiredString(object, "standard_version_id");
  const versionNumber = object.version_number;
  const status = parseStatus(object.status);
  const source = requiredString(object, "source");
  const evidenceIds = stringArray(object.evidence_ids);
  const createdByMembershipId = requiredString(
    object,
    "created_by_membership_id"
  );
  const editorMembershipIds = stringArray(object.editor_membership_ids);

  if (
    !organizationId ||
    !standardKind ||
    !standardId ||
    !standardVersionId ||
    !Number.isSafeInteger(versionNumber) ||
    !status ||
    !source ||
    !evidenceIds ||
    !createdByMembershipId ||
    !editorMembershipIds
  ) {
    return undefined;
  }

  return {
    organizationId,
    standardKind,
    standardId,
    standardVersionId,
    versionNumber: Number(versionNumber),
    status,
    source,
    evidenceIds,
    createdByMembershipId,
    editorMembershipIds,
    ...(optionalString(object, "reviewer_membership_id")
      ? { reviewerMembershipId: optionalString(object, "reviewer_membership_id") }
      : {})
  };
}

function standardDetailParameters(
  input: CreateStandardVersionRequest | UpdateDraftVersionRequest
): Readonly<Record<string, unknown>> {
  if (input.kind === "material") {
    return {
      p_unit: input.unit,
      p_specification: input.specification,
      p_applicability: input.applicability,
      p_interpretation_basis: null,
      p_method_description: null,
      p_conditions: null,
      p_referenced_standard_version_ids: []
    };
  }
  if (input.kind === "labor") {
    return {
      p_unit: input.unit,
      p_specification: null,
      p_applicability: input.applicability,
      p_interpretation_basis: input.interpretationBasis,
      p_method_description: null,
      p_conditions: null,
      p_referenced_standard_version_ids: []
    };
  }
  return {
    p_unit: null,
    p_specification: null,
    p_applicability: null,
    p_interpretation_basis: null,
    p_method_description: input.methodDescription,
    p_conditions: input.conditions,
    p_referenced_standard_version_ids: input.applicableStandardVersions.map(
      ({ standardVersionId }) => standardVersionId
    )
  };
}

function identityDetailParameters(
  input: CreateStandardRequest | UpdateStandardRequest
): Readonly<Record<string, unknown>> {
  return {
    p_classification: input.kind === "material" ? input.classification : null,
    p_category: input.kind === "labor" ? input.category : null,
    p_intended_scope:
      input.kind === "work_method" ? input.intendedScope : null
  };
}

export function createSupabaseStandardsRepository(
  client: AuthenticatedSupabaseRpcClient
): StandardsRepository {
  async function call<T>(
    functionName: string,
    parameters: Readonly<Record<string, unknown>>,
    parse: (data: unknown) => T | undefined
  ): Promise<StandardsRepositoryResult<T>> {
    try {
      const { data, error } = await client.rpc(functionName, parameters);
      if (error) return failure(mapRpcError(error));

      const parsed = parse(data);
      return parsed
        ? { ok: true, data: parsed }
        : failure({
            code: "database_error",
            message: "The standards data operation returned an invalid response."
          });
    } catch {
      return failure({
        code: "database_error",
        message: "The standards data operation failed."
      });
    }
  }

  const receipt = (
    functionName: string,
    parameters: Readonly<Record<string, unknown>>
  ) => call(functionName, parameters, parseReceipt);

  return {
    getVersionMutationContext: ({ organizationId, standardVersionId }) =>
      call(
        RPC.getContext,
        {
          p_organization_id: organizationId,
          p_standard_version_id: standardVersionId
        },
        parseContext
      ),

    createStandard: (input) =>
      receipt(RPC.createStandard, {
        p_organization_id: input.organizationId,
        p_kind: input.kind,
        p_code: input.code,
        p_name: input.name,
        ...identityDetailParameters(input)
      }),

    updateStandard: (input) =>
      receipt(RPC.updateStandard, {
        p_organization_id: input.organizationId,
        p_standard_id: input.standardId,
        p_kind: input.kind,
        p_code: input.code,
        p_name: input.name,
        ...identityDetailParameters(input)
      }),

    createVersion: (input) =>
      receipt(RPC.createVersion, {
        p_organization_id: input.organizationId,
        p_standard_id: input.standardId,
        p_kind: input.kind,
        p_source: input.source,
        ...standardDetailParameters(input)
      }),

    updateDraftVersion: (input) =>
      receipt(RPC.updateDraftVersion, {
        p_organization_id: input.organizationId,
        p_standard_id: input.standardId,
        p_standard_version_id: input.standardVersionId,
        p_kind: input.kind,
        p_source: input.source,
        ...standardDetailParameters(input)
      }),

    addEvidence: (input: AddStandardEvidenceRequest) =>
      receipt(RPC.addEvidence, {
        p_organization_id: input.organizationId,
        p_standard_version_id: input.standardVersionId,
        p_title: input.title,
        p_source: input.source,
        p_source_uri: input.sourceUri ?? null,
        p_content_hash: input.contentHash ?? null,
        p_captured_at: input.capturedAt
      }),

    submitForReview: (input: SubmitStandardForReviewRequest) =>
      receipt(RPC.submitForReview, {
        p_organization_id: input.organizationId,
        p_standard_version_id: input.standardVersionId,
        p_reviewer_membership_id: input.reviewerMembershipId
      }),

    approveVersion: (input: ApproveStandardVersionRequest) =>
      receipt(RPC.approveVersion, {
        p_organization_id: input.organizationId,
        p_standard_version_id: input.standardVersionId,
        p_effective_date: input.effectiveDate
      }),

    rejectVersion: (input: RejectStandardVersionRequest) =>
      receipt(RPC.rejectVersion, {
        p_organization_id: input.organizationId,
        p_standard_version_id: input.standardVersionId,
        p_rationale: input.rationale
      }),

    retireVersion: (input: RetireStandardVersionRequest) =>
      receipt(RPC.retireVersion, {
        p_organization_id: input.organizationId,
        p_standard_version_id: input.standardVersionId,
        p_rationale: input.rationale
      })
  };
}
