import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const DEMO_ONLY_ROOT = resolve(import.meta.dirname, "../..");

describe("DEMO_ONLY Standards UI architecture boundary", () => {
  it("DEMO_ONLY reads through authenticated RLS client without privileged key or mutation bypass", async () => {
    const source = await readFile(resolve(DEMO_ONLY_ROOT, "apps/web/src/server/standards/queries.ts"), "utf8");
    expect(source).toContain("createAuthenticatedSupabaseClient");
    expect(source).not.toMatch(/service[_-]?role/i);
    expect(source).not.toMatch(/\.insert\(|\.update\(|\.delete\(/);
  });

  it("DEMO_ONLY uses Phase 1D Server Actions as the only UI mutation entrypoints", async () => {
    const source = await readFile(resolve(DEMO_ONLY_ROOT, "apps/web/src/features/standards/mutation-forms.tsx"), "utf8");
    expect(source).toContain("../../server/standards/actions");
    expect(source).not.toContain("createAuthenticatedSupabaseClient");
    expect(source).not.toMatch(/\.from\(|\.rpc\(/);
  });

  it("DEMO_ONLY shares Domain read DTOs without exposing database row types to UI", async () => {
    const uiSources = await Promise.all([
      "views.tsx",
      "presentation.ts",
      "route-params.ts",
      "mutation-forms.tsx"
    ].map((file) => readFile(
      resolve(DEMO_ONLY_ROOT, "apps/web/src/features/standards", file),
      "utf8"
    )));
    const localPolicy = await readFile(
      resolve(DEMO_ONLY_ROOT, "apps/web/src/server/standards/read-model.ts"),
      "utf8"
    );

    expect(uiSources.every((source) => source.includes("@yuppie/domain"))).toBe(true);
    expect(uiSources.join("\n")).not.toContain("@yuppie/db");
    expect(localPolicy).not.toContain("interface StandardVersionReadModel");
  });

  it("DEMO_ONLY keeps excluded feature terms out of production Standards routes", async () => {
    const source = await readFile(resolve(DEMO_ONLY_ROOT, "apps/web/src/features/standards/views.tsx"), "utf8");
    expect(source).not.toMatch(/Project|Booth|Workpiece|BOQ|Takeoff|Pricing|Quotation|Stock|Purchase Order|AI อ่านแบบ/);
  });
});
