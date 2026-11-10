
"use client";

import { useEffect, useState } from "react";

type ExamResult = {
  id: number;
  testId: number;
  score: number;
  totalQuestions: number;
  createdAt: string;
  test: {
    title: string;
  };
};

export default function ResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
const [currentPage, setCurrentPage] = useState(1);

const resultsPerPage = 10;

  useEffect(() => {
    async function fetchResults() {
      try {
      const response = await fetch("/api/results", {
  cache: "no-store",
});

const data = await response.json();

// Redirect if student is not logged in
if (response.status === 401) {
  window.location.href = "/login";
  return;
}

if (!response.ok) {
  throw new Error(data.error || "Could not load results.");
}

        setResults(data.results || []);
      } catch (error) {
        setError("Unable to load exam results.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []);

  const filteredResults = results.filter((result) =>
  `exam result #${result.id}`.includes(search.toLowerCase())
);

const totalPages = Math.ceil(filteredResults.length / resultsPerPage);

const startIndex = (currentPage - 1) * resultsPerPage;

const paginatedResults = filteredResults.slice(
  startIndex,
  startIndex + resultsPerPage
);
  const totalExams = results.length;

  const percentages = results.map((result) =>
    result.totalQuestions > 0
      ? (result.score / result.totalQuestions) * 100
      : 0
  );

  const averageScore =
    totalExams > 0
      ? Math.round(
          percentages.reduce((total, value) => total + value, 0) /
            totalExams
        )
      : 0;

  const highestScore =
    totalExams > 0 ? Math.round(Math.max(...percentages)) : 0;

  if (loading) {
    return <main className="dashboard-shell">Loading dashboard...</main>;
  }

  if (error) {
    return <main className="dashboard-shell">{error}</main>;
  }

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Student Dashboard</h1>
            <p className="dashboard-subtitle">
              Track your State SSC and PCS exam performance.
            </p>
          </div>

          <a href="/" className="dashboard-button">
            Back to Home
          </a>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Total Exams Attempted</p>
            <h2 className="stat-value">{totalExams}</h2>
          </div>

          <div className="stat-card">
            <p className="stat-label">Average Score</p>
            <h2 className="stat-value">{averageScore}%</h2>
          </div>

          <div className="stat-card">
            <p className="stat-label">Highest Score</p>
            <h2 className="stat-value">{highestScore}%</h2>
          </div>
        </section>

        <section className="results-panel">
          <h2 className="results-heading">Recent Exam Results</h2>
          <input
  type="text"
  placeholder="Search by result number..."
  value={search}
  onChange={(e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  }}
  style={{
    width: "100%",
    padding: "12px",
    marginBottom: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "16px",
  }}
/>

         {results.length === 0 ? (
  <p>No exam results found. Attempt your first test!</p>
) : filteredResults.length === 0 ? (
  <p>No matching exam results found.</p>
) : (
            paginatedResults.map((result) => {
              const percentage =
                result.totalQuestions > 0
                  ? Math.round(
                      (result.score / result.totalQuestions) * 100
                    )
                  : 0;

              return (
<a
  href={`/exam-result?resultId=${result.id}`}
  className="result-row"
  key={result.id}
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textDecoration: "none",
    color: "inherit",
    cursor: "pointer",
  }}
>
                  <div>
                   <h3>{result.test.title}</h3>
                   <p style={{ fontSize: "13px", color: "#64748b" }}>
                   Exam Result #{result.id}
                    </p>
                    <p className="result-date">
                      {new Date(result.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div>
                    <p>
                      Score: {result.score}/{result.totalQuestions}
                    </p>
                    <p className="result-score">
                      {percentage}%
                    </p>
                  </div>
                </a>
              );
            })
          )}
          {filteredResults.length > 0 && (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "15px",
      padding: "20px 0",
    }}
  >
    <button
      onClick={() => setCurrentPage((page) => page - 1)}
      disabled={currentPage === 1}
    >
      Previous
    </button>

    <span>
      Page {currentPage} of {totalPages}
    </span>

    <button
      onClick={() => setCurrentPage((page) => page + 1)}
      disabled={currentPage === totalPages}
    >
      Next
    </button>
  </div>
)}
        </section>
      </div>
    </main>
  );
}
