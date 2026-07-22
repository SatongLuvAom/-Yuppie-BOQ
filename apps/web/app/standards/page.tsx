import { StandardsDashboardView, StandardsReadError } from "../../src/features/standards/views";
import { getStandardsWorkspace } from "../../src/server/standards/queries";

export const dynamic = "force-dynamic";

export default async function StandardsDashboardPage() {
  const result = await getStandardsWorkspace({}, "dashboard");
  return result.ok
    ? <StandardsDashboardView model={result.data} />
    : <StandardsReadError result={result} path="/standards" />;
}
