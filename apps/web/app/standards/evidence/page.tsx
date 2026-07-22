import { StandardsEvidenceView, StandardsReadError } from "../../../src/features/standards/views";
import { getStandardsWorkspace } from "../../../src/server/standards/queries";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const result = await getStandardsWorkspace({}, "evidence");
  return result.ok ? <StandardsEvidenceView model={result.data} /> : <StandardsReadError result={result} path="/standards/evidence" />;
}
