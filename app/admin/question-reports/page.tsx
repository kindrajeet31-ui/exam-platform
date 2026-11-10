
"use client";

import { useEffect, useState } from "react";

type Report = {
  id: number;
  category: string;
  description: string | null;
  status: string;
  createdAt: string;
  student: {
    id: number;
    name: string;
    email: string;
  };
  question: {
    id: number;
    questionText: string;
    test: {
      id: number;
      title: string;
    };
  };
};

export default function QuestionReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
const [statusFilter, setStatusFilter] = useState("ALL");
const [searchTerm, setSearchTerm] = useState("");

const [currentPage, setCurrentPage] = useState(1);

const filteredReports = reports.filter((report) => {
  const matchesStatus =
    statusFilter === "ALL" || report.status === statusFilter;

  const search = searchTerm.toLowerCase();

  const matchesSearch =
    report.student.name.toLowerCase().includes(search) ||
    report.student.email.toLowerCase().includes(search) ||
    report.question.questionText.toLowerCase().includes(search) ||
    report.question.test.title.toLowerCase().includes(search);

  return matchesStatus && matchesSearch;
});

const reportsPerPage = 10;

const totalPages = Math.ceil(
  filteredReports.length / reportsPerPage
);

const paginatedReports = filteredReports.slice(
  (currentPage - 1) * reportsPerPage,
  currentPage * reportsPerPage
);

useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, statusFilter]);

    const pendingCount = reports.filter(
  (report) => report.status === "PENDING"
).length;

const reviewedCount = reports.filter(
  (report) => report.status === "REVIEWED"
).length;

const resolvedCount = reports.filter(
  (report) => report.status === "RESOLVED"
).length;
  async function loadReports() {
    try {
      const response = await fetch("/api/admin/question-reports", {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/admin-login";
        return;
      }

      const data = await response.json();

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

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    setError("");

    try {
      const response = await fetch("/api/admin/question-reports", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin-login";
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to update status.");
      }

      setReports((previous) =>
        previous.map((report) =>
          report.id === id ? { ...report, status } : report
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main style={styles.container}>
      <h1 style={styles.heading}>Question Reports</h1>
<button
  onClick={loadReports}
  disabled={loading}
  style={{
    padding: "10px 18px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "15px",
  }}
>
{loading ? "Refreshing..." : "↻ Refresh Reports"}
</button>
      <p>View and manage problems reported by students.</p>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <h3>Admin Menu</h3>

          <a href="/admin-dashboard" style={styles.link}>
            Dashboard
          </a>
          <a href="/admin/tests" style={styles.link}>
            Create Mock Tests
          </a>
          <a href="/admin/manage-tests" style={styles.link}>
            Manage Tests
          </a>
          <a href="/admin/questions" style={styles.link}>
            Add Questions
          </a>
          <a href="/admin/manage-questions" style={styles.link}>
            Manage Questions
          </a>
          <a href="/admin/students" style={styles.link}>
            Manage Students
          </a>
          <a href="/admin/results" style={styles.link}>
            Exam Results
          </a>
          <a href="/leaderboard" style={styles.link}>
            Leaderboard
          </a>
        </aside>

        <section style={styles.content}>
            <div style={styles.summaryGrid}>
  <div style={styles.summaryCard}>
    <h3>Pending Reports</h3>
    <h2 style={{ color: "#dc2626" }}>{pendingCount}</h2>
  </div>

  <div style={styles.summaryCard}>
    <h3>Reviewed Reports</h3>
    <h2 style={{ color: "#d97706" }}>{reviewedCount}</h2>
  </div>

  <div style={styles.summaryCard}>
    <h3>Resolved Reports</h3>
    <h2 style={{ color: "#16a34a" }}>{resolvedCount}</h2>
  </div>
</div>
<div style={{ marginBottom: "20px" }}>
  <h2>Student Reports ({filteredReports.length})</h2>
  <input
  type="text"
  placeholder="Search student, email, question or exam..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  style={{
    width: "100%",
    maxWidth: "450px",
    padding: "12px",
    marginTop: "12px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    borderRadius: "7px",
  }}
/>

  <label>
    Filter Reports:{" "}
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      style={styles.select}
    >
      <option value="ALL">All Reports</option>
      <option value="PENDING">Pending</option>
      <option value="REVIEWED">Reviewed</option>
      <option value="RESOLVED">Resolved</option>
    </select>
  </label>
  <button
  onClick={() => {
    setStatusFilter("ALL");
    setSearchTerm("");
    setCurrentPage(1);
  }}
  style={styles.pageButton}
>
  Clear Filters
</button>
</div>

          {error && <p style={styles.error}>{error}</p>}

          {loading ? (
            <p>Loading reports...</p>
) : filteredReports.length === 0 ? (
  <p>
    {reports.length === 0
      ? "No question reports received yet."
      : "No reports match your search or filter."}
  </p>
          ) : (
paginatedReports.map((report) => (
              <div key={report.id} style={styles.card}>
                <div style={styles.reportHeader}>
                  <strong>Report #{report.id}</strong>
                  <span style={styles.status}>{report.status}</span>
                </div>

                <p>
                  <strong>Student:</strong> {report.student.name}
                </p>
                <p>
                  <strong>Email:</strong> {report.student.email}
                </p>
                <p>
                  <strong>Exam:</strong> {report.question.test.title}
                </p>
                <p>
                  <strong>Question ID:</strong> {report.question.id}
                </p>

                <p>
                  <strong>Question:</strong>
                </p>
                <p style={styles.question}>
                  {report.question.questionText}
                </p>

                <p>
                  <strong>Problem:</strong> {report.category}
                </p>

                <p>
                  <strong>Student Description:</strong>
                </p>
                <p>{report.description || "No description provided."}</p>

                <small>
                  Reported:{" "}
                  {new Date(report.createdAt).toLocaleString("en-IN")}
                </small>

                <div style={styles.statusControl}>
                  <label>
                    Update Status:{" "}
                    <select
                      value={report.status}
                      disabled={updatingId === report.id}
                      onChange={(e) =>
                        updateStatus(report.id, e.target.value)
                      }
                      style={styles.select}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="REVIEWED">Reviewed</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </label>

                  {updatingId === report.id && (
                    <span> Updating...</span>
                  )}
                </div>
              </div>
            ))
          )}

{filteredReports.length > 0 && (
  <p style={{ textAlign: "center", color: "#555", marginTop: 15 }}>
    Showing {(currentPage - 1) * reportsPerPage + 1}–
    {Math.min(currentPage * reportsPerPage, filteredReports.length)}
    {" "}of {filteredReports.length} reports
  </p>
)}
          {filteredReports.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "15px",
                marginTop: "25px",
              }}
            >
              <button
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={currentPage === 1}
                style={styles.pageButton}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
                disabled={currentPage === totalPages}
                style={styles.pageButton}
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1400px",
    margin: "30px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  heading: {
    color: "#174ea6",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "220px minmax(0, 1fr)",
    gap: "25px",
    marginTop: "25px",
    alignItems: "start",
  },
  sidebar: {
    background: "#f0f5ff",
    border: "1px solid #d5e2f5",
    borderRadius: "10px",
    padding: "15px",
    display: "grid",
    gap: "10px",
  },
  link: {
    display: "block",
    padding: "12px",
    background: "#174ea6",
    color: "white",
    textDecoration: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "14px",
  },
  content: {
    minWidth: 0,
  },
  card: {
    padding: "20px",
    marginBottom: "18px",
    border: "1px solid #d5e2f5",
    borderRadius: "10px",
    background: "white",
    overflowWrap: "anywhere",
  },
  reportHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
  status: {
    color: "#174ea6",
    fontWeight: "bold",
  },
  question: {
    background: "#f0f5ff",
    padding: "12px",
    borderRadius: "6px",
  },
  statusControl: {
    marginTop: "18px",
  },
  select: {
    padding: "9px",
    borderRadius: "6px",
    border: "1px solid #aaa",
    marginLeft: "8px",
  },
  error: {
    color: "red",
  },
  summaryGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "15px",
  marginBottom: "25px",
},
summaryCard: {
  padding: "18px",
  background: "#f0f5ff",
  border: "1px solid #d5e2f5",
  borderRadius: "10px",
},
pageButton: {
  padding: "10px 18px",
  background: "#174ea6",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
},
};
