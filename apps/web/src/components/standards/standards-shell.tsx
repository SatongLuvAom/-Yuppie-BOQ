import Link from "next/link";
import type { ReactNode } from "react";

export interface StandardsNavigationItem {
  href: string;
  label: string;
}

export interface StandardsShellProps {
  children: ReactNode;
  currentPath?: string;
  organizationName?: string;
  navigation?: readonly StandardsNavigationItem[];
}

export const standardsNavigation: readonly StandardsNavigationItem[] = [
  { href: "/standards", label: "หน้าหลักมาตรฐาน" },
  { href: "/standards/materials", label: "วัสดุมาตรฐาน" },
  { href: "/standards/labor", label: "ค่าแรงมาตรฐาน" },
  { href: "/standards/work-methods", label: "วิธีการผลิต" },
  { href: "/standards/review", label: "รอตรวจสอบ" },
  { href: "/standards/evidence", label: "หลักฐานอ้างอิง" },
  { href: "/standards/activity", label: "ประวัติการดำเนินการ" }
];

function isCurrentPath(currentPath: string | undefined, href: string): boolean {
  if (!currentPath) {
    return false;
  }

  return href === "/standards"
    ? currentPath === href
    : currentPath === href || currentPath.startsWith(`${href}/`);
}

export function StandardsShell({
  children,
  currentPath,
  organizationName,
  navigation = standardsNavigation
}: StandardsShellProps) {
  return (
    <div className="standards-shell">
      <aside className="standards-shell__rail" aria-label="เมนูพื้นที่มาตรฐาน">
        <Link className="standards-shell__brand" href="/standards">
          <span className="standards-shell__brand-mark" aria-hidden="true">
            YP
          </span>
          <span className="standards-shell__brand-copy">
            <span className="standards-shell__brand-name">YUPPIE</span>
            <span className="standards-shell__brand-area">พื้นที่มาตรฐานงานผลิต</span>
          </span>
        </Link>

        <p className="standards-shell__nav-label">Standards workspace</p>
        <nav className="standards-shell__nav">
          {navigation.map((item, index) => {
            const isCurrent = isCurrentPath(currentPath, item.href);

            return (
              <Link
                className="standards-shell__nav-link"
                href={item.href}
                key={item.href}
                aria-current={isCurrent ? "page" : undefined}
              >
                <span className="standards-shell__nav-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {organizationName ? (
          <div className="standards-shell__context">
            <span className="standards-shell__context-label">องค์กรที่กำลังใช้งาน</span>
            <span className="standards-shell__context-value">{organizationName}</span>
          </div>
        ) : null}
      </aside>

      <main className="standards-shell__main">
        <div className="standards-shell__content">{children}</div>
      </main>
    </div>
  );
}
