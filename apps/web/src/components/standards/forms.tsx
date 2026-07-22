import type { ReactNode } from "react";

export interface FormSectionProps {
  title: string;
  description?: string;
  step?: string;
  children: ReactNode;
}

export function FormSection({ title, description, step, children }: FormSectionProps) {
  return (
    <section className="form-section">
      <header className="form-section__heading">
        <div>
          <h2 className="form-section__title">{title}</h2>
          {description ? <p className="form-section__description">{description}</p> : null}
        </div>
        {step ? <span className="form-section__step">{step}</span> : null}
      </header>
      {children}
    </section>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="form-grid">{children}</div>;
}

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}

export function FormField({ label, htmlFor, required, hint, error, wide, children }: FormFieldProps) {
  return (
    <div className={`form-field${wide ? " form-field--wide" : ""}`}>
      <label htmlFor={htmlFor}>
        {label}
        {required ? <span className="form-field__required" aria-hidden="true">*</span> : null}
        {required ? <span className="sr-only"> จำเป็น</span> : null}
      </label>
      {children}
      {error ? <p className="form-field__error" id={`${htmlFor}-error`}>{error}</p> : null}
      {!error && hint ? <p className="form-field__hint" id={`${htmlFor}-hint`}>{hint}</p> : null}
    </div>
  );
}

export interface AdvancedSectionProps {
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function AdvancedSection({
  summary = "ข้อมูลเพิ่มเติม",
  children,
  defaultOpen = false
}: AdvancedSectionProps) {
  return (
    <details className="advanced-section" open={defaultOpen}>
      <summary>{summary}</summary>
      <div className="advanced-section__body">{children}</div>
    </details>
  );
}

export interface ConfirmationSurfaceProps {
  title: string;
  description: string;
  actions: ReactNode;
  danger?: boolean;
}

export function ConfirmationSurface({ title, description, actions, danger }: ConfirmationSurfaceProps) {
  return (
    <section
      className={`confirmation${danger ? " confirmation--danger" : ""}`}
      aria-label={title}
    >
      <h2 className="confirmation__title">{title}</h2>
      <p className="confirmation__description">{description}</p>
      <div className="button-group">{actions}</div>
    </section>
  );
}
