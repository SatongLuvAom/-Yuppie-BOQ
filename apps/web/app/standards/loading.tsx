import { LoadingState, StandardsShell } from "../../src/components/standards";

export default function StandardsLoading() {
  return <StandardsShell><LoadingState label="กำลังโหลดพื้นที่มาตรฐาน" /></StandardsShell>;
}
