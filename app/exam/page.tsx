
import { Suspense } from "react";
import ExamClient from "./ExamClient";

export default function ExamPage() {
  return (
    <Suspense fallback={<main className="dashboard-shell">Loading exam...</main>}>
      <ExamClient />
    </Suspense>
  );
}
