
"use client";

import { useEffect, useMemo, useState } from "react";

type LeaderboardEntry = {
  id: number;
  studentName: string;
  examName: string;
  setNumber: number | null;
  testTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  rank: number;
  totalParticipants: number;
  createdAt: string;
};

export default function LeaderboardPage() {
  const [results, setResults] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedExam, setSelectedExam] = useState("all");
  const [selectedSet, setSelectedSet] = useState("all");
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const response = await fetch("/api/leaderboard", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load leaderboard.");
        }

        setResults(data.leaderboard || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  const exams = useMemo(
    () => [...new Set(results.map((r) => r.examName))].sort(),
    [results]
  );

  const sets = useMemo(
    () =>
      [...new Set(
        results
          .filter(
            (r) => selectedExam === "all" || r.examName === selectedExam
          )
          .map((r) => r.setNumber)
          .filter((s): s is number => s !== null)
      )].sort((a, b) => a - b),
    [results, selectedExam]
  );

  const filteredResults = useMemo(() => {
    return results
      .filter((result) => {
        const examMatches =
          selectedExam === "all" || result.examName === selectedExam;

        const setMatches =
          selectedSet === "all" ||
          result.setNumber === Number(selectedSet);

        const nameMatches = result.studentName
          .toLowerCase()
          .includes(searchName.toLowerCase().trim());

        return examMatches && setMatches && nameMatches;
      })
      .sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }

        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return (
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
        );
      });
  }, [results, selectedExam, selectedSet, searchName]);

  if (loading) {
    return <main className="dashboard-shell">Loading leaderboard...</main>;
  }

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <h1 className="dashboard-title">Student Leaderboard</h1>

        <p className="dashboard-subtitle">
          See the top-performing students in each mock test.
        </p>

        {error ? (
          <section className="results-panel">
            <p>{error}</p>
            <a href="/login" className="dashboard-button">Login</a>
          </section>
        ) : results.length === 0 ? (
          <section className="results-panel">
            <p>No exam results available yet.</p>
          </section>
        ) : (
          <>
            <section
              className="results-panel"
              style={{
                marginTop: "20px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "15px",
              }}
            >
              <div>
                <label>Filter by Exam</label>
                <select
                  value={selectedExam}
                  onChange={(e) => {
                    setSelectedExam(e.target.value);
                    setSelectedSet("all");
                  }}
                  style={filterStyle}
                >
                  <option value="all">All Exams</option>
                  {exams.map((exam) => (
                    <option key={exam} value={exam}>{exam}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Filter by Set</label>
                <select
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                  style={filterStyle}
                >
                  <option value="all">All Sets</option>
                  {sets.map((set) => (
                    <option key={set} value={set}>Set {set}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Search Student</label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Enter student name"
                  style={filterStyle}
                />
              </div>
            </section>

            <p style={{ marginTop: "15px" }}>
              Showing {filteredResults.length} result(s)
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "15px",
                marginTop: "20px",
                marginBottom: "20px",
              }}
            >
              {[
                { medal: "🥇", position: "1st Rank", color: "#fff7d6" },
                { medal: "🥈", position: "2nd Rank", color: "#f1f5f9" },
                { medal: "🥉", position: "3rd Rank", color: "#fff0e6" },
              ].map((item, index) => {
                const winner = filteredResults[index];

                return (
                  <div
                    key={item.position}
                    style={{
                      padding: "20px",
                      borderRadius: "12px",
                      background: item.color,
                      textAlign: "center",
                      border: "1px solid #e5eaf2",
                    }}
                  >
                    <h2>{item.medal} {item.position}</h2>
                    <h3>{winner ? winner.studentName : "No student yet"}</h3>
                    <p>
                      {winner
                        ? `${winner.score}/${winner.totalQuestions} (${winner.percentage}%)`
                        : ""}
                    </p>
                  </div>
                );
              })}
            </div>

            <section className="results-panel" style={{ marginTop: "20px" }}>
              {filteredResults.length === 0 ? (
                <p>No matching results found.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "650px",
                    }}
                  >
                    <thead>
                      <tr>
                        {["Rank", "Student", "Exam / Set", "Score", "Percentage"].map(
                          (heading) => (
                            <th key={heading} style={cellStyle}>
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredResults.map((result, index) => (
                        <tr key={result.id}>
                          <td style={cellStyle}>
                            <strong>#{index + 1}</strong>
                          </td>
                          <td style={cellStyle}>{result.studentName}</td>
                          <td style={cellStyle}>
                            {result.examName}
                            {result.setNumber ? ` - Set ${result.setNumber}` : ""}
                          </td>
                          <td style={cellStyle}>
                            {result.score}/{result.totalQuestions}
                          </td>
                          <td style={cellStyle}>{result.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <a href="/tests" className="dashboard-button">
          Browse Tests
        </a>
      </div>
    </main>
  );
}

const filterStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "11px",
  marginTop: "8px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  background: "white",
};

const cellStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "left",
  borderBottom: "1px solid #e5eaf2",
};
