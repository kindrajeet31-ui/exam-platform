
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ExamResult = {
  id: number;
  score: number;
  totalQuestions: number;
  createdAt: string;
  student: {
    name: string;
    email: string;
  };
  test: {
    title: string;
  };
};

export default function AdminResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
const resultsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  
  useEffect(() => {
    async function loadResults() {
      try {
        const response = await fetch("/api/admin/results");
        const data = await response.json();

     if (response.status === 401 || response.status === 403) {
  router.replace("/admin-login");
  return;
}

if (!response.ok) {
  setMessage(data.error || "Unable to load results.");
  return;
}

        setResults(data.results || []);
      } catch {
        setMessage("Unable to connect to server.");
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, []);
  function exportResults() {
  const headers = [
    "Student Name",
    "Email",
    "Mock Test",
    "Score",
    "Total Questions",
    "Percentage",
    "Date",
  ];

  const rows = filteredResults.map((result) => [
    result.student.name,
    result.student.email,
    result.test.title,
    result.score,
    result.totalQuestions,
    result.totalQuestions > 0
      ? Math.round((result.score / result.totalQuestions) * 100) + "%"
      : "0%",
    new Date(result.createdAt).toLocaleDateString(),
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "exam-results.csv";
  link.click();

  URL.revokeObjectURL(url);
}
async function handleDeleteResult(resultId: number) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this exam result?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`/api/admin/results/${resultId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Unable to delete result.");
      return;
    }

    setResults((currentResults) =>
      currentResults.filter((result) => result.id !== resultId)
    );

    alert("Exam result deleted successfully.");
  } catch {
    alert("Unable to connect to server.");
  }
}
  const filteredResults = results.filter((result) => {
    const searchText = search.toLowerCase();

    return (
      
      result.student.name.toLowerCase().includes(searchText) ||
      result.student.email.toLowerCase().includes(searchText) ||
      result.test.title.toLowerCase().includes(searchText)
    ); 
  });
  const totalPages = Math.ceil(
  filteredResults.length / resultsPerPage
);

const startIndex = (currentPage - 1) * resultsPerPage;

const paginatedResults = filteredResults.slice(
  startIndex,
  startIndex + resultsPerPage
);
    const averagePercentage =
    results.length > 0
      ? Math.round(
          results.reduce(
            (total, result) =>
              total +
              (result.totalQuestions > 0
                ? (result.score / result.totalQuestions) * 100
                : 0),
            0
          ) / results.length
        )
      : 0;

  const highestPercentage =
    results.length > 0
      ? Math.round(
          Math.max(
            ...results.map((result) =>
              result.totalQuestions > 0
                ? (result.score / result.totalQuestions) * 100
                : 0
            )
          )
        )
      : 0;

  return (
    
    <main style={styles.container}>
      <h1>Admin Exam Results</h1>

      <p>View all examination attempts by students.</p>

     <div style={styles.statsGrid}>
  <div style={styles.card}>
    <h2>Total Exam Attempts</h2>
    <p style={styles.number}>{results.length}</p>
  </div>

  <div style={styles.card}>
    <h2>Average Percentage</h2>
    <p style={styles.number}>{averagePercentage}%</p>
  </div>

  <div style={styles.card}>
    <h2>Highest Percentage</h2>
    <p style={styles.number}>{highestPercentage}%</p>
  </div>
</div>
      <h2>Student Exam History</h2>
      <button
  onClick={exportResults}
  disabled={filteredResults.length === 0}
  style={{
    padding: "10px 18px",
    background: "#174ea6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "15px",
  }}
>
  Download Results (CSV)
</button>
      <input
  type="text"
  placeholder="Search by student name, email or exam name..."
  value={search}
onChange={(e) => {
  setSearch(e.target.value);
  setCurrentPage(1);
}}
  style={{
    width: "100%",
    maxWidth: "500px",
    padding: "12px",
    marginBottom: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "15px",
  }}
/>

      {loading ? (
        <p>Loading results...</p>
      ) : message ? (
        <p style={styles.error}>{message}</p>
      ) : results.length === 0 ? (
  <p>No exam results available yet.</p>
) : filteredResults.length === 0 ? (
  <p>No matching exam results found.</p>
) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cell}>Student</th>
                <th style={styles.cell}>Email</th>
                <th style={styles.cell}>Mock Test</th>
                <th style={styles.cell}>Score</th>
                <th style={styles.cell}>Percentage</th>
                <th style={styles.cell}>Total Questions</th>
                <th style={styles.cell}>Date</th>
                <th style={styles.cell}>Action</th>
              </tr>
            </thead>

            <tbody>
           {paginatedResults.map((result) => (
                <tr key={result.id}>
                  <td style={styles.cell}>
                    {result.student.name}
                  </td>

                  <td style={styles.cell}>
                    {result.student.email}
                  </td>

                  <td style={styles.cell}>
                    {result.test.title}
                  </td>

                  <td style={styles.cell}>
                    {result.score}
                  </td>
                  <td style={styles.cell}>
  {result.totalQuestions > 0
    ? Math.round(
        (result.score / result.totalQuestions) * 100
      )
    : 0}%
</td>

                  <td style={styles.cell}>
                    {result.totalQuestions}
                  </td>

                  <td style={styles.cell}>
                    {new Date(result.createdAt).toLocaleDateString()}
                  </td>
                  <td style={styles.cell}>
  <button
    onClick={() => handleDeleteResult(result.id)}
    style={{
      background: "#dc2626",
      color: "white",
      border: "none",
      padding: "8px 12px",
      borderRadius: "5px",
      cursor: "pointer",
    }}
  >
    Delete
  </button>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

{filteredResults.length > 0 && (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "15px",
      marginTop: "20px",
    }}
  >
    <button
      onClick={() => setCurrentPage((page) => page - 1)}
      disabled={currentPage === 1}
      style={{
        padding: "8px 16px",
        cursor: currentPage === 1 ? "not-allowed" : "pointer",
      }}
    >
      Previous
    </button>

    <span>
      Page {currentPage} of {totalPages}
    </span>

    <button
      onClick={() => setCurrentPage((page) => page + 1)}
      disabled={currentPage === totalPages}
      style={{
        padding: "8px 16px",
        cursor:
          currentPage === totalPages ? "not-allowed" : "pointer",
      }}
    >
      Next
    </button>
  </div>
)}
      <br />

      <a href="/admin-dashboard">
        ← Back to Admin Dashboard
      </a>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1200px",
    margin: "40px auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  card: {
    background: "#f0f5ff",
    padding: "20px",
    borderRadius: "10px",
    margin: "25px 0",
  },
  number: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#174ea6",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
  },
  cell: {
    border: "1px solid #ddd",
    padding: "12px",
    textAlign: "left",
  },
  error: {
    color: "red",
  },
  statsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "15px",
  margin: "25px 0",
},
};
