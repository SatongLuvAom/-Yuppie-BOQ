import { StandardsReadError, StandardsReviewView } from "../../../src/features/standards/views";
import { getStandardsWorkspace } from "../../../src/server/standards/queries";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const result = await getStandardsWorkspace({}, "review");
  return result.ok ? <StandardsReviewView model={result.data} /> : <StandardsReadError result={result} path="/standards/review" />;
}
