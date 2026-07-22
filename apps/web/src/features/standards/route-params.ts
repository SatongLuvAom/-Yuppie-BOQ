import type { StandardKind } from "@yuppie/domain";

import type { StandardsDisplayStatus } from "../../server/standards/read-model";
import type { StandardsSearchParams } from "./views";

export type RawSearchParams = Readonly<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseStandardsSearchParams(raw: RawSearchParams): StandardsSearchParams {
  const status = first(raw.status);
  const tab = first(raw.tab);
  return {
    ...(first(raw.q) ? { q: first(raw.q) } : {}),
    ...(first(raw.category) ? { category: first(raw.category) } : {}),
    ...(["draft", "review", "approved", "rejected", "retired"].includes(status ?? "")
      ? { status: status as StandardsDisplayStatus }
      : {}),
    ...(["details", "evidence", "versions", "activity"].includes(tab ?? "")
      ? { tab: tab as StandardsSearchParams["tab"] }
      : {}),
    ...(first(raw.version) ? { version: first(raw.version) } : {})
  };
}

export const collectionKinds: Readonly<Record<string, StandardKind>> = {
  materials: "material",
  labor: "labor",
  "work-methods": "work_method"
};
