import { parseStandardsSearchParams, type RawSearchParams } from "../../../src/features/standards/route-params";
import { StandardsListView, StandardsReadError } from "../../../src/features/standards/views";
import { getStandardsWorkspace } from "../../../src/server/standards/queries";

export const dynamic = "force-dynamic";

export default async function MaterialsPage({ searchParams }: { readonly searchParams: Promise<RawSearchParams> }) {
  const params = parseStandardsSearchParams(await searchParams);
  const result = await getStandardsWorkspace({ kind: "material", search: params.q, category: params.category, status: params.status }, "list");
  return result.ok ? <StandardsListView model={result.data} kind="material" params={params} /> : <StandardsReadError result={result} path="/standards/materials" />;
}
