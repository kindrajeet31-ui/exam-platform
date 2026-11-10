
"use client";

import { useEffect, useState } from "react";

type Report = {
  id: number;
  category: string;
  description: string | null;
  status: string;
  createdAt: string;
  question: {
    id: number;
    questionText: string;
    test: {
      id: number;
      title: string;
    };
  };
};

export default function StudentReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/question-reports", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to load reports.");
      }

      setReports(data.reports || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  function statusColor(status: string) {
    if (status === "RESOLVED") return "#15803d";
    if (status === "REVIEWED") return "#2563eb";
    return "#d97706";
  }

  return (
    <main style={styles.container}>
      <h1 style={styles.heading}>My Question Reports</h1>

      <p style={styles.subtitle}>
        Track the questions you have reported and their current status.
      </p>

      <button
        onClick={loadReports}
        disabled={loading}
        style={styles.button}
      >
        {loading ? "Loading..." : "↻ Refresh Reports"}
      </button>

      {loading ? (
        <p>Loading your reports...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : reports.length === 0 ? (
        <p>You have not submitted any question reports yet.</p>
      ) : (
        <div style={styles.list}>
          {reports.map((report) => (
            <div key={report.id} style={styles.card}>
              <h3>{report.question.test.title}</h3>

              <p>
                <strong>Question:</strong>{" "}
                {report.question.questionText}
              </p>

              <p>
                <strong>Category:</strong> {report.category}
              </p>

              {report.description && (
                <p>
                  <strong>Your description:</strong>{" "}
                  {report.description}
                </p>
              )}

              <p>
                <strong>Submitted:</strong>{" "}
                {new Date(report.createdAt).toLocaleString()}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    ...styles.status,
                    background: statusColor(report.status),
                  }}
                >
                  {report.status}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      <a href="/student" style={styles.backLink}>
        ← Back to Student Dashboard
      </a>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "900px",
    margin: "30px auto",
    padding: "20px",
  },
  heading: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#666",
    marginBottom: "20px",
  },
  button: {
    padding: "10px 18px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  list: {
    display: "grid",
    gap: "16px",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "18px",
    background: "#fff",
  },
  status: {
    color: "white",
    padding: "5px 10px",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  backLink: {
    display: "inline-block",
    marginTop: "25px",
    color: "#2563eb",
    textDecoration: "none",
  },
};
