export interface ValidationIssue {
  readonly path: string;
  readonly code: "required" | "invalid_type" | "invalid_format" | "invalid_value";
  readonly message: string;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly issues: readonly ValidationIssue[] };

export interface ValidationSchema<T> {
  safeParse(input: unknown): ValidationResult<T>;
}

export type SchemaOutput<TSchema> =
  TSchema extends ValidationSchema<infer TOutput> ? TOutput : never;

export function schema<T>(
  parse: (input: unknown) => ValidationResult<T>
): ValidationSchema<T> {
  return { safeParse: parse };
}
