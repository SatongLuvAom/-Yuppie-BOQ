import { notFound } from "next/navigation";

import { collectionKinds, parseStandardsSearchParams, type RawSearchParams } from "../../../../src/features/standards/route-params";
import { StandardDetailView, StandardsReadError } from "../../../../src/features/standards/views";
import { getStandardsWorkspace } from "../../../../src/server/standards/queries";

export const dynamic = "force-dynamic";

export default async function StandardDetailPage({
  params,
  searchParams
}: {
  readonly params: Promise<{ readonly collection: string; readonly id: string }>;
  readonly searchParams: Promise<RawSearchParams>;
}) {
  const route = await params;
  const kind = collectionKinds[route.collection];
  if (!kind) notFound();
  const parsed = parseStandardsSearchParams(await searchParams);
  const result = await getStandardsWorkspace({ kind, standardId: route.id }, "detail");
  if (!result.ok) return <StandardsReadError result={result} path={`/standards/${route.collection}`} />;
  const standard = result.data.standards[0];
  if (!standard) notFound();
  return <StandardDetailView model={result.data} standard={standard} params={parsed} />;
}
