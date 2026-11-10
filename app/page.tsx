
export default function HomePage() {
  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              State SSC/PCS Mock Exam & Railway Exam
            </h1>
            <p className="dashboard-subtitle">
              Your preparation starts here. Practice, improve and succeed.
            </p>
          </div>
        </header>

        <section
          className="results-panel"
          style={{
            padding: "40px 25px",
            textAlign: "center",
            background: "#eff6ff",
          }}
        >
          <h2 style={{ fontSize: "30px", color: "#174ea6" }}>
            Welcome to Your Exam Preparation Platform!
          </h2>

          <p style={{ fontSize: "17px", margin: "20px 0" }}>
            Prepare for State SSC and PCS examinations with online mock tests.
            Practice regularly and track your performance.
          </p>

          <a href="/tests" className="dashboard-button">
            Start Mock Test
          </a>
        </section>

        <section className="stats-grid" style={{ marginTop: "25px" }}>
          <div className="stat-card">
            <h2>Practice Tests</h2>
            <p>Attempt mock examinations to improve your preparation.</p>
          </div>

          <div className="stat-card">
            <h2>Student Dashboard</h2>
            <p>Access your account and track your progress.</p>
            <a href="/student" className="dashboard-button">
              Open Dashboard
            </a>
          </div>

          <div className="stat-card">
            <h2>Exam Results</h2>
            <p>Review your previous exam performance.</p>
            <a href="/results" className="dashboard-button">
              View Results
            </a>
          </div>
        </section>

        <footer style={{ textAlign: "center", marginTop: "40px" }}>
          <p>State SSC & PCS Mock Exam Platform</p>
          <a href="/login">Student Login</a>
          {" | "}
          <a href="/register">Student Registration</a>
        </footer>
      </div>
    </main>
  );
}
