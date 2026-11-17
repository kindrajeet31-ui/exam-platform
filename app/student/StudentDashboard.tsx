
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
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/login";
      } else {
        alert("Logout failed. Please try again.");
        setLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Could not log out. Please try again.");
      setLoggingOut(false);
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
        console.error("Could not load results:", error);
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

  const latestResult = results[0];

  if (loading) {
    return (
      <main className="student-dashboard">
        <div className="loading-card">
          <div className="loading-spinner" />
          <h2>Loading your dashboard...</h2>
          <p>Please wait a moment.</p>
        </div>

        <style>{styles}</style>
      </main>
    );
  }

  return (
    <main className="student-dashboard">
      <style>{styles}</style>

      <header className="student-topbar">
        <div className="student-brand">
          <div className="brand-icon">🎓</div>
          <div>
            <strong>STATE SSC & PCS</strong>
            <small>STUDENT LEARNING PORTAL</small>
          </div>
        </div>

        <div className="topbar-right">
          <span className="student-status">● Student Account</span>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="logout-button"
          >
            {loggingOut ? "Logging out..." : "Logout ↗"}
          </button>
        </div>
      </header>

      <div className="student-container">
        <section className="welcome-banner">
          <div>
            <span className="welcome-label">STUDENT DASHBOARD</span>
            <h1>Welcome back, {student.name}!</h1>
            <p>
              Keep learning, practice regularly and move closer to
              your examination goals.
            </p>
            <div className="student-email">✉ {student.email}</div>
          </div>

          <div className="welcome-illustration">📚</div>
        </section>

        <div className="section-heading">
          <div>
            <h2>Your Performance</h2>
            <p>Track your examination progress.</p>
          </div>
        </div>

        <section className="student-stats">
          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-icon blue">📝</span>
              <span className="stat-tag">ACTIVITY</span>
            </div>
            <p className="stat-label">Exams Attempted</p>
            <h2>{totalTests}</h2>
            <small>Total completed exam results</small>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-icon green">📈</span>
              <span className="stat-tag">AVERAGE</span>
            </div>
            <p className="stat-label">Average Score</p>
            <h2>{averageScore}%</h2>
            <div className="score-track">
              <div
                className="score-fill green-fill"
                style={{ width: `${averageScore}%` }}
              />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-icon orange">🏆</span>
              <span className="stat-tag">PERSONAL BEST</span>
            </div>
            <p className="stat-label">Highest Score</p>
            <h2>{highestScore}%</h2>
            <small>Your best exam performance</small>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-icon purple">🎯</span>
              <span className="stat-tag">LATEST EXAM</span>
            </div>
            <p className="stat-label">Latest Result</p>
            <h2>{latestResult ? `${latestResult.percentage}%` : "—"}</h2>
            <small>
              {latestResult
                ? `Rank #${latestResult.rank} of ${latestResult.totalParticipants}`
                : "Attempt your first exam"}
            </small>
          </div>
        </section>

        <section className="quick-section">
          <div className="section-heading">
            <div>
              <h2>Quick Access</h2>
              <p>Everything you need for exam preparation.</p>
            </div>
          </div>

          <div className="quick-grid">
            <a href="/tests" className="quick-card primary-quick">
              <span className="quick-icon">📖</span>
              <div>
                <strong>Browse Mock Tests</strong>
                <small>Find and attempt available exams</small>
              </div>
              <span className="quick-arrow">→</span>
            </a>

            <a href="/leaderboard" className="quick-card">
              <span className="quick-icon">🏆</span>
              <div>
                <strong>Leaderboard</strong>
                <small>Compare your exam performance</small>
              </div>
              <span className="quick-arrow">→</span>
            </a>

            <a href="/student/reports" className="quick-card">
              <span className="quick-icon">📋</span>
              <div>
                <strong>My Question Reports</strong>
                <small>Check your submitted reports</small>
              </div>
              <span className="quick-arrow">→</span>
            </a>
          </div>
        </section>

        <section className="history-section">
          <div className="section-heading">
            <div>
              <h2>Recent Exam Results</h2>
              <p>Your examination history and performance.</p>
            </div>

            <span className="result-count">
              {totalTests} Results
            </span>
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No exams attempted yet</h3>
              <p>
                Start your preparation by attempting your first mock test.
              </p>
              <a href="/tests" className="start-button">
                Browse Available Tests →
              </a>
            </div>
          ) : (
            <div className="results-list">
              {results.map((result) => {
                const scorePercentage =
                  result.totalQuestions > 0
                    ? Math.round(
                        (result.score / result.totalQuestions) * 100
                      )
                    : 0;

                return (
                  <article className="result-card" key={result.id}>
                    <div className="result-main">
                      <div className="result-icon">📄</div>

                      <div className="result-details">
                        <h3>{result.test?.title || "Mock Exam"}</h3>
                        <p>
                          {new Date(result.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="result-metrics">
                      <div>
                        <small>Score</small>
                        <strong>
                          {result.score}/{result.totalQuestions}
                        </strong>
                      </div>

                      <div>
                        <small>Percentage</small>
                        <strong className="percentage-value">
                          {result.percentage}%
                        </strong>
                      </div>

                      <div>
                        <small>Rank</small>
                        <strong>#{result.rank}</strong>
                      </div>
                    </div>

                    <div className="result-progress">
                      <div
                        className="score-fill"
                        style={{
                          width: `${Math.min(100, Math.max(0, scorePercentage))}%`,
                        }}
                      />
                    </div>

                    <a
                      href={`/exam-result?resultId=${result.id}`}
                      className="detail-button"
                    >
                      View Details →
                    </a>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="student-footer">
          <strong>STATE SSC & PCS MOCK EXAM</strong>
          <p>Keep practicing. Keep improving. Achieve your goals.</p>
        </footer>
      </div>
    </main>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  .student-dashboard {
    min-height: 100vh;
    background: #f3f6fc;
    color: #17243b;
    font-family: Arial, Helvetica, sans-serif;
    padding-bottom: 30px;
  }

  .student-topbar {
    background: #10264a;
    color: white;
    min-height: 76px;
    padding: 14px 5%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
  }

  .student-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-icon {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    background: #254875;
    border-radius: 11px;
    font-size: 23px;
  }

  .student-brand strong {
    display: block;
    font-size: 17px;
    letter-spacing: .4px;
  }

  .student-brand small {
    display: block;
    color: #adc2e2;
    font-size: 10px;
    letter-spacing: 1px;
    margin-top: 5px;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
  }

  .student-status {
    color: #bcebd0;
    font-size: 12px;
  }

  .logout-button {
    background: #dc3545;
    color: white;
    border: 0;
    border-radius: 8px;
    padding: 11px 17px;
    font-weight: bold;
    cursor: pointer;
  }

  .logout-button:disabled {
    opacity: .65;
    cursor: wait;
  }

  .student-container {
    max-width: 1300px;
    margin: auto;
    padding: 30px 4%;
  }

  .welcome-banner {
    background: linear-gradient(120deg, #173967, #2865a9);
    color: white;
    border-radius: 17px;
    padding: 34px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    box-shadow: 0 8px 22px rgba(22, 58, 103, .12);
  }

  .welcome-label {
    color: #c4dcff;
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 1.5px;
  }

  .welcome-banner h1 {
    font-size: 29px;
    margin: 12px 0;
    overflow-wrap: anywhere;
  }

  .welcome-banner p {
    color: #e0ecff;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
  }

  .student-email {
    margin-top: 15px;
    color: #d5e5ff;
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .welcome-illustration {
    font-size: 70px;
    background: rgba(255,255,255,.12);
    border-radius: 50%;
    width: 120px;
    height: 120px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .section-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin: 30px 0 17px;
    flex-wrap: wrap;
  }

  .section-heading h2 {
    margin: 0;
    font-size: 20px;
    color: #1b2e4c;
  }

  .section-heading p {
    color: #8290a5;
    font-size: 13px;
    margin: 7px 0 0;
  }

  .student-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(205px, 1fr));
    gap: 16px;
  }

  .stat-card {
    background: white;
    padding: 21px;
    border: 1px solid #e4eaf3;
    border-radius: 13px;
    box-shadow: 0 3px 12px rgba(25,45,80,.04);
    min-width: 0;
  }

  .stat-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-icon {
    width: 43px;
    height: 43px;
    border-radius: 11px;
    display: grid;
    place-items: center;
    font-size: 22px;
  }

  .blue { background: #e8f1ff; }
  .green { background: #e7f8ee; }
  .orange { background: #fff2df; }
  .purple { background: #f0eaff; }

  .stat-tag {
    font-size: 9px;
    font-weight: bold;
    color: #8290a5;
    letter-spacing: .7px;
  }

  .stat-label {
    font-size: 13px;
    color: #7a879c;
    margin: 17px 0 7px;
  }

  .stat-card h2 {
    font-size: 30px;
    margin: 0;
    color: #193e72;
  }

  .stat-card > small {
    display: block;
    margin-top: 10px;
    font-size: 11px;
    color: #8995a8;
  }

  .score-track {
    height: 7px;
    background: #eaf0f7;
    border-radius: 20px;
    margin-top: 15px;
    overflow: hidden;
  }

  .score-fill {
    height: 7px;
    background: #3178d5;
    border-radius: 20px;
    max-width: 100%;
  }

  .green-fill {
    background: #20a46b;
  }

  .quick-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 14px;
  }

  .quick-card {
    background: white;
    color: #203650;
    text-decoration: none;
    border: 1px solid #e3eaf3;
    border-radius: 12px;
    padding: 19px;
    display: flex;
    align-items: center;
    gap: 13px;
    transition: transform .2s, box-shadow .2s;
    min-width: 0;
  }

  .quick-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 7px 18px rgba(25,45,80,.09);
  }

  .primary-quick {
    border-color: #c9dcfa;
    background: #fafdff;
  }

  .quick-icon {
    font-size: 25px;
    flex-shrink: 0;
  }

  .quick-card strong {
    display: block;
    font-size: 13px;
  }

  .quick-card small {
    display: block;
    margin-top: 6px;
    color: #8491a5;
    font-size: 11px;
    line-height: 1.5;
  }

  .quick-arrow {
    margin-left: auto;
    color: #3178d5;
    font-size: 21px;
  }

  .result-count {
    background: #e9f2ff;
    color: #245da1;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
  }

  .results-list {
    display: grid;
    gap: 13px;
  }

  .result-card {
    background: white;
    border: 1px solid #e4eaf3;
    border-radius: 12px;
    padding: 19px;
    display: grid;
    grid-template-columns: minmax(180px, 1.5fr) repeat(3, minmax(75px, .6fr)) minmax(110px, auto);
    align-items: center;
    gap: 15px;
  }

  .result-main {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .result-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    background: #eef4ff;
    border-radius: 10px;
    font-size: 21px;
    flex-shrink: 0;
  }

  .result-details {
    min-width: 0;
  }

  .result-details h3 {
    font-size: 13px;
    margin: 0;
    overflow-wrap: anywhere;
  }

  .result-details p {
    color: #8a97aa;
    font-size: 11px;
    margin: 7px 0 0;
  }

  .result-metrics {
    display: contents;
  }

  .result-metrics div small {
    display: block;
    color: #8a97aa;
    font-size: 10px;
    margin-bottom: 7px;
  }

  .result-metrics div strong {
    font-size: 14px;
    color: #263d5e;
  }

  .result-metrics .percentage-value {
    color: #16875b;
  }

  .detail-button {
    background: #1e5796;
    color: white;
    text-align: center;
    text-decoration: none;
    padding: 10px 12px;
    border-radius: 7px;
    font-size: 11px;
    font-weight: bold;
    white-space: nowrap;
  }

  .result-progress {
    display: none;
  }

  .empty-state {
    background: white;
    border: 1px dashed #cbd6e6;
    border-radius: 13px;
    padding: 40px 20px;
    text-align: center;
  }

  .empty-icon {
    font-size: 42px;
  }

  .empty-state h3 {
    margin: 13px 0 8px;
  }

  .empty-state p {
    color: #8793a7;
    font-size: 13px;
    margin-bottom: 20px;
  }

  .start-button {
    display: inline-block;
    background: #205c9d;
    color: white;
    text-decoration: none;
    padding: 12px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: bold;
  }

  .student-footer {
    text-align: center;
    padding: 35px 10px 10px;
    color: #8793a7;
  }

  .student-footer strong {
    color: #405675;
    font-size: 12px;
    letter-spacing: .7px;
  }

  .student-footer p {
    font-size: 11px;
    margin-top: 8px;
  }

  .loading-card {
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #526580;
  }

  .loading-card h2 {
    font-size: 18px;
  }

  .loading-card p {
    font-size: 13px;
  }

  .loading-spinner {
    width: 36px;
    height: 36px;
    border: 4px solid #dce7f5;
    border-top-color: #2865a9;
    border-radius: 50%;
    animation: student-spin .8s linear infinite;
  }

  @keyframes student-spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 900px) {
    .result-card {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .result-main {
      grid-column: 1 / -1;
    }

    .detail-button {
      grid-column: 1 / -1;
    }

    .result-progress {
      display: block;
      grid-column: 1 / -1;
      background: #eaf0f7;
      height: 7px;
      border-radius: 20px;
      overflow: hidden;
    }
  }

  @media (max-width: 600px) {
    .student-topbar {
      padding: 15px;
    }

    .student-container {
      padding: 20px 14px;
    }

    .welcome-banner {
      padding: 23px 19px;
    }

    .welcome-banner h1 {
      font-size: 23px;
    }

    .welcome-illustration {
      width: 65px;
      height: 65px;
      font-size: 35px;
    }

    .student-brand strong {
      font-size: 14px;
    }

    .topbar-right {
      width: 100%;
      justify-content: space-between;
    }

    .result-card {
      grid-template-columns: repeat(3, 1fr);
      padding: 15px;
      gap: 13px 8px;
    }

    .result-metrics div strong {
      font-size: 13px;
    }

    .quick-grid {
      grid-template-columns: 1fr;
    }
  }
`;
