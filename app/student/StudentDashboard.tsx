"use client";

import { useEffect, useState } from "react";

type ExamResult = {
  id: number;
  score: number;
  totalQuestions: number;
  createdAt: string;
  test: {
    title: string;
  };
  percentage: number;
rank: number;
totalParticipants: number;
};

type Student = {
  id: number;
  name: string;
  email: string;
};

export default function StudentDashboard({
  student,
}: {
  student: Student;
}) {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  async function handleLogout() {
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
    });

    if (response.ok) {
      window.location.href = "/login";
    } else {
      alert("Logout failed. Please try again.");
    }
  } catch (error) {
    console.error("Logout failed:", error);
    alert("Could not log out. Please try again.");
  }
}

  useEffect(() => {
    async function loadResults() {
      try {
        const response = await fetch("/api/results", {
          cache: "no-store",
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const data = await response.json();

        if (response.ok) {
          setResults(data.results || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, []);

  const totalTests = results.length;

  const averageScore =
    totalTests > 0
      ? Math.round(
          results.reduce(
            (total, result) =>
              total +
              (result.totalQuestions > 0
                ? (result.score / result.totalQuestions) * 100
                : 0),
            0
          ) / totalTests
        )
      : 0;

  const highestScore =
    totalTests > 0
      ? Math.max(
          ...results.map((result) =>
            result.totalQuestions > 0
              ? Math.round(
                  (result.score / result.totalQuestions) * 100
                )
              : 0
          )
        )
      : 0;

  if (loading) {
    return <main className="dashboard-shell">Loading dashboard...</main>;
  }

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              Welcome, {student.name}!
            </h1>
            <p className="dashboard-subtitle">
              Email: {student.email}
            </p>
            <p className="dashboard-subtitle">
              Track your exam preparation and performance.
            </p>
          </div>

<button
  onClick={handleLogout}
  className="dashboard-button"
  style={{
    backgroundColor: "#dc2626",
    cursor: "pointer",
    border: "none",
  }}
>
  Logout
</button>

</header>

        <div className="results-grid">
          <section className="results-panel">
            <h3>Total Tests</h3>
            <h2>{totalTests}</h2>
          </section>

          <section className="results-panel">
            <h3>Average Score</h3>
            <h2>{averageScore}%</h2>
          </section>

          <section className="results-panel">
            <h3>Highest Score</h3>
            <h2>{highestScore}%</h2>
          </section>
        </div>

        <section className="results-panel" style={{ marginTop: "25px" }}>
          <h2 className="results-heading">Recent Exam Results</h2>

          {results.length === 0 ? (
            <p>No exams attempted yet.</p>
          ) : (
            results.map((result) => (
              <div
                key={result.id}
                style={{
                  padding: "15px",
                  borderBottom: "1px solid #e5eaf2",
                }}
              >
                <h3>{result.test?.title || "Mock Exam"}</h3>
<p>
  Score: {result.score}/{result.totalQuestions}
</p>

<p>
  Percentage: {result.percentage}%
</p>

<p>
  Rank: #{result.rank} out of {result.totalParticipants}
</p>
<a
  href={`/exam-result?resultId=${result.id}`}
  className="dashboard-button"
  style={{
    display: "inline-block",
    marginTop: "10px",
    textDecoration: "none",
  }}
>
  View Detailed Result
</a>
                <p>
                  Date: {new Date(result.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </section>

<div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
  <a href="/tests" className="dashboard-button">
    Browse Tests
  </a>

  <a href="/leaderboard" className="dashboard-button">
    View Leaderboard
  </a>

  <a href="/student/reports" className="dashboard-button">
    My Question Reports
  </a>
</div>
      </div>
    </main>
  );
}