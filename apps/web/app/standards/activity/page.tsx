import { StandardsAuditView, StandardsReadError } from "../../../src/features/standards/views";
import { getStandardsWorkspace } from "../../../src/server/standards/queries";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const result = await getStandardsWorkspace({}, "audit");
  return result.ok ? <StandardsAuditView model={result.data} /> : <StandardsReadError result={result} path="/standards/activity" />;
}
