import type {
  AddStandardEvidenceRequest,
  ApproveStandardVersionRequest,
  CreateStandardRequest,
  CreateStandardVersionRequest,
  RejectStandardVersionRequest,
  RetireStandardVersionRequest,
  StandardKind,
  StandardVersionReference,
  SubmitStandardForReviewRequest,
  UpdateDraftVersionRequest,
  UpdateStandardRequest
} from "@yuppie/domain";

import {
  schema,
  type ValidationIssue,
  type ValidationResult,
  type ValidationSchema
} from "./schema";

type InputObject = Readonly<Record<string, unknown>>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

function issue(
  path: string,
  code: ValidationIssue["code"],
  message: string
): ValidationIssue {
  return { path, code, message };
}

function asObject(input: unknown): ValidationResult<InputObject> {
  return typeof input === "object" && input !== null && !Array.isArray(input)
    ? { success: true, data: input as InputObject }
    : {
        success: false,
        issues: [issue("$", "invalid_type", "Expected an object.")]
      };
}

function requiredString(
  input: InputObject,
  key: string,
  issues: ValidationIssue[]
): string {
  const value = input[key];
  if (typeof value !== "string") {
    issues.push(issue(key, value === undefined ? "required" : "invalid_type", `${key} must be a string.`));
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    issues.push(issue(key, "required", `${key} is required.`));
  }
  return trimmed;
}

function optionalString(
  input: InputObject,
  key: string,
  issues: ValidationIssue[]
): string | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    issues.push(issue(key, "invalid_type", `${key} must be a string.`));
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    issues.push(issue(key, "invalid_value", `${key} cannot be empty.`));
  }
  return trimmed;
}

function uuid(
  input: InputObject,
  key: string,
  issues: ValidationIssue[]
): string {
  const value = requiredString(input, key, issues);
  if (value.length > 0 && !UUID_PATTERN.test(value)) {
    issues.push(issue(key, "invalid_format", `${key} must be a UUID.`));
  }
  return value;
}

function standardKind(
  input: InputObject,
  issues: ValidationIssue[]
): StandardKind | undefined {
  const value = input.kind;
  if (value !== "material" && value !== "labor" && value !== "work_method") {
    issues.push(issue("kind", "invalid_value", "kind is not supported."));
    return undefined;
  }
  return value;
}

function result<T>(issues: ValidationIssue[], data: T): ValidationResult<T> {
  return issues.length === 0
    ? { success: true, data }
    : { success: false, issues };
}

function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isIsoDateTime(value: string): boolean {
  return (
    ISO_DATE_TIME_PATTERN.test(value) &&
    isIsoDate(value.slice(0, 10)) &&
    !Number.isNaN(Date.parse(value))
  );
}

function parseStandardIdentity(
  input: unknown,
  includeId: boolean
): ValidationResult<CreateStandardRequest | UpdateStandardRequest> {
  const object = asObject(input);
  if (!object.success) return object;

  const issues: ValidationIssue[] = [];
  const organizationId = uuid(object.data, "organizationId", issues);
  const standardId = includeId
    ? uuid(object.data, "standardId", issues)
    : undefined;
  const code = requiredString(object.data, "code", issues);
  const name = requiredString(object.data, "name", issues);
  const kind = standardKind(object.data, issues);

  if (kind === "material") {
    const data = {
      organizationId,
      ...(standardId ? { standardId } : {}),
      kind,
      code,
      name,
      classification: requiredString(object.data, "classification", issues)
    } as CreateStandardRequest | UpdateStandardRequest;
    return result(issues, data);
  }

  if (kind === "labor") {
    const data = {
      organizationId,
      ...(standardId ? { standardId } : {}),
      kind,
      code,
      name,
      category: requiredString(object.data, "category", issues)
    } as CreateStandardRequest | UpdateStandardRequest;
    return result(issues, data);
  }

  const data = {
    organizationId,
    ...(standardId ? { standardId } : {}),
    kind: "work_method",
    code,
    name,
    intendedScope: requiredString(object.data, "intendedScope", issues)
  } as CreateStandardRequest | UpdateStandardRequest;
  return result(issues, data);
}

function parseReference(
  input: unknown,
  path: string,
  expectedOrganizationId: string,
  issues: ValidationIssue[]
): StandardVersionReference | undefined {
  const object = asObject(input);
  if (!object.success) {
    issues.push(issue(path, "invalid_type", "A standard version reference must be an object."));
    return undefined;
  }

  const localIssues: ValidationIssue[] = [];
  const organizationId = uuid(object.data, "organizationId", localIssues);
  const standardId = uuid(object.data, "standardId", localIssues);
  const standardVersionId = uuid(object.data, "standardVersionId", localIssues);
  const referenceKind = object.data.standardKind;
  if (
    referenceKind !== "material" &&
    referenceKind !== "labor" &&
    referenceKind !== "work_method"
  ) {
    localIssues.push(issue("standardKind", "invalid_value", "standardKind is not supported."));
  }
  const versionNumber = object.data.versionNumber;
  if (!Number.isSafeInteger(versionNumber) || Number(versionNumber) < 1) {
    localIssues.push(issue("versionNumber", "invalid_value", "versionNumber must be a positive integer."));
  }
  if (organizationId && organizationId !== expectedOrganizationId) {
    localIssues.push(issue("organizationId", "invalid_value", "Referenced standards must belong to the request organization."));
  }

  issues.push(
    ...localIssues.map((entry) => ({ ...entry, path: `${path}.${entry.path}` }))
  );
  if (localIssues.length > 0) return undefined;

  return {
    organizationId,
    standardKind: referenceKind as StandardKind,
    standardId,
    standardVersionId,
    versionNumber: Number(versionNumber)
  };
}

function parseStandardVersion(
  input: unknown,
  includeVersionId: boolean
): ValidationResult<CreateStandardVersionRequest | UpdateDraftVersionRequest> {
  const object = asObject(input);
  if (!object.success) return object;

  const issues: ValidationIssue[] = [];
  const organizationId = uuid(object.data, "organizationId", issues);
  const standardId = uuid(object.data, "standardId", issues);
  const standardVersionId = includeVersionId
    ? uuid(object.data, "standardVersionId", issues)
    : undefined;
  const source = requiredString(object.data, "source", issues);
  const kind = standardKind(object.data, issues);

  const common = {
    organizationId,
    standardId,
    ...(standardVersionId ? { standardVersionId } : {}),
    source
  };

  if (kind === "material") {
    return result(issues, {
      ...common,
      kind,
      unit: requiredString(object.data, "unit", issues),
      specification: requiredString(object.data, "specification", issues),
      applicability: requiredString(object.data, "applicability", issues)
    } as CreateStandardVersionRequest | UpdateDraftVersionRequest);
  }

  if (kind === "labor") {
    return result(issues, {
      ...common,
      kind,
      unit: requiredString(object.data, "unit", issues),
      interpretationBasis: requiredString(object.data, "interpretationBasis", issues),
      applicability: requiredString(object.data, "applicability", issues)
    } as CreateStandardVersionRequest | UpdateDraftVersionRequest);
  }

  const references = object.data.applicableStandardVersions;
  const applicableStandardVersions: StandardVersionReference[] = [];
  if (!Array.isArray(references)) {
    issues.push(issue("applicableStandardVersions", "invalid_type", "applicableStandardVersions must be an array."));
  } else {
    references.forEach((reference, index) => {
      const parsed = parseReference(
        reference,
        `applicableStandardVersions.${index}`,
        organizationId,
        issues
      );
      if (parsed) applicableStandardVersions.push(parsed);
    });
  }

  return result(issues, {
    ...common,
    kind: "work_method",
    methodDescription: requiredString(object.data, "methodDescription", issues),
    conditions: requiredString(object.data, "conditions", issues),
    applicableStandardVersions
  } as CreateStandardVersionRequest | UpdateDraftVersionRequest);
}

function lifecycleRequest<T>(
  parseExtra: (
    input: InputObject,
    issues: ValidationIssue[]
  ) => Omit<T, "organizationId" | "standardVersionId">
): ValidationSchema<T> {
  return schema((input) => {
    const object = asObject(input);
    if (!object.success) return object;
    const issues: ValidationIssue[] = [];
    const data = {
      organizationId: uuid(object.data, "organizationId", issues),
      standardVersionId: uuid(object.data, "standardVersionId", issues),
      ...parseExtra(object.data, issues)
    } as T;
    return result(issues, data);
  });
}

export const createStandardRequestSchema = schema<CreateStandardRequest>(
  (input) => parseStandardIdentity(input, false) as ValidationResult<CreateStandardRequest>
);

export const updateStandardRequestSchema = schema<UpdateStandardRequest>(
  (input) => parseStandardIdentity(input, true) as ValidationResult<UpdateStandardRequest>
);

export const createStandardVersionRequestSchema =
  schema<CreateStandardVersionRequest>(
    (input) => parseStandardVersion(input, false) as ValidationResult<CreateStandardVersionRequest>
  );

export const updateDraftVersionRequestSchema = schema<UpdateDraftVersionRequest>(
  (input) => parseStandardVersion(input, true) as ValidationResult<UpdateDraftVersionRequest>
);

export const addStandardEvidenceRequestSchema =
  lifecycleRequest<AddStandardEvidenceRequest>((input, issues) => {
    const sourceUri = optionalString(input, "sourceUri", issues);
    const contentHash = optionalString(input, "contentHash", issues);
    if (sourceUri) {
      try {
        new URL(sourceUri);
      } catch {
        issues.push(issue("sourceUri", "invalid_format", "sourceUri must be an absolute URI."));
      }
    }
    const capturedAt = requiredString(input, "capturedAt", issues);
    if (capturedAt && !isIsoDateTime(capturedAt)) {
      issues.push(issue("capturedAt", "invalid_format", "capturedAt must be an ISO date-time with a time zone."));
    }
    return {
      title: requiredString(input, "title", issues),
      source: requiredString(input, "source", issues),
      ...(sourceUri ? { sourceUri } : {}),
      ...(contentHash ? { contentHash } : {}),
      capturedAt
    };
  });

export const submitStandardForReviewRequestSchema =
  lifecycleRequest<SubmitStandardForReviewRequest>((input, issues) => ({
    reviewerMembershipId: uuid(input, "reviewerMembershipId", issues)
  }));

export const approveStandardVersionRequestSchema =
  lifecycleRequest<ApproveStandardVersionRequest>((input, issues) => {
    const effectiveDate = requiredString(input, "effectiveDate", issues);
    if (
      effectiveDate &&
      !isIsoDate(effectiveDate)
    ) {
      issues.push(issue("effectiveDate", "invalid_format", "effectiveDate must use YYYY-MM-DD."));
    }
    return { effectiveDate };
  });

const rationale = (input: InputObject, issues: ValidationIssue[]) => ({
  rationale: requiredString(input, "rationale", issues)
});

export const rejectStandardVersionRequestSchema =
  lifecycleRequest<RejectStandardVersionRequest>(rationale);

export const retireStandardVersionRequestSchema =
  lifecycleRequest<RetireStandardVersionRequest>(rationale);
