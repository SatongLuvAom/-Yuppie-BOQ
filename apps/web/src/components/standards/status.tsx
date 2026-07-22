import type { ReactNode } from "react";

export type PresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface StatusBadgeProps {
  label: string;
  tone?: PresentationTone;
}

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return <span className={`status-badge tone--${tone}`}>{label}</span>;
}

export interface StatusBannerProps {
  title: string;
  description: ReactNode;
  tone?: PresentationTone;
}

export function StatusBanner({ title, description, tone = "neutral" }: StatusBannerProps) {
  return (
    <section className={`status-banner tone--${tone}`} aria-label={title}>
      <span className="status-banner__marker" aria-hidden="true" />
      <div>
        <h2 className="status-banner__title">{title}</h2>
        <p className="status-banner__description">{description}</p>
      </div>
    </section>
  );
}
