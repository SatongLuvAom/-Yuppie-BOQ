import Link from "next/link";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="page-header__title">{title}</h1>
        {description ? <p className="page-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}

export interface MetricItem {
  label: string;
  value: ReactNode;
  hint?: string;
}

export function MetricSummary({ items, label = "ภาพรวมมาตรฐาน" }: { items: readonly MetricItem[]; label?: string }) {
  return (
    <section className="metric-grid" aria-label={label}>
      {items.map((item) => (
        <div className="metric" key={item.label}>
          <span className="metric__label">{item.label}</span>
          <strong className="metric__value">{item.value}</strong>
          {item.hint ? <span className="metric__hint">{item.hint}</span> : null}
        </div>
      ))}
    </section>
  );
}

export interface SurfaceProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function Surface({ title, description, actions, children }: SurfaceProps) {
  return (
    <section className="surface">
      {title || description || actions ? (
        <header className="surface__header">
          <div>
            {title ? <h2 className="surface__title">{title}</h2> : null}
            {description ? <p className="surface__description">{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className="surface__body">{children}</div>
    </section>
  );
}

export function TableFrame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="table-wrap" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}

export interface CompactListItem {
  id: string;
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
}

export function CompactList({ items, label }: { items: readonly CompactListItem[]; label: string }) {
  return (
    <section className="compact-list" aria-label={label}>
      {items.map((item) => (
        <article className="compact-list__item" key={item.id}>
          <div className="compact-list__copy">
            <span className="compact-list__label">{item.label}</span>
            <div className="compact-list__value">{item.value}</div>
            {item.meta ? <div className="compact-list__meta">{item.meta}</div> : null}
          </div>
          {item.action ? <div className="compact-list__action">{item.action}</div> : null}
        </article>
      ))}
    </section>
  );
}

export interface StatePanelProps {
  marker: string;
  title: string;
  description: string;
  action?: ReactNode;
  role?: "status" | "alert";
}

export function StatePanel({ marker, title, description, action, role = "status" }: StatePanelProps) {
  return (
    <div className="state-panel" role={role}>
      <div className="state-panel__content">
        <span className="state-panel__mark" aria-hidden="true">{marker}</span>
        <h2 className="state-panel__title">{title}</h2>
        <p className="state-panel__description">{description}</p>
        {action}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action }: Omit<StatePanelProps, "marker">) {
  return <StatePanel marker="—" title={title} description={description} action={action} />;
}

export function ErrorState({ title, description, action }: Omit<StatePanelProps, "marker">) {
  return <StatePanel marker="!" title={title} description={description} action={action} role="alert" />;
}

export function LoadingState({ label = "กำลังโหลดข้อมูล" }: { label?: string }) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <div className="loading-bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export interface TabItem {
  href: string;
  label: string;
  current?: boolean;
}

export function DetailTabs({ items, label = "รายละเอียดมาตรฐาน" }: { items: readonly TabItem[]; label?: string }) {
  return (
    <nav className="tabs" aria-label={label}>
      {items.map((item) => (
        <Link
          className="tabs__link"
          href={item.href}
          key={item.href}
          aria-current={item.current ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
