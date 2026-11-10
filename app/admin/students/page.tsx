
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Student = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export default function ManageStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
const studentsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadStudents() {
      try {
        const response = await fetch("/api/admin/students");
        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
  router.replace("/admin-login");
  return;
}

if (!response.ok) {
  setMessage(data.error || "Unable to load students.");
  return;
}

        setStudents(data.students || []);
      } catch {
        setMessage("Unable to connect to server.");
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

    const filteredStudents = students.filter((student) => {
    const searchText = search.toLowerCase();

    return (
      student.name.toLowerCase().includes(searchText) ||
      student.email.toLowerCase().includes(searchText)
    );
  });
  const totalPages = Math.ceil(
  filteredStudents.length / studentsPerPage
);

const startIndex = (currentPage - 1) * studentsPerPage;

const paginatedStudents = filteredStudents.slice(
  startIndex,
  startIndex + studentsPerPage
);

  return (
    <main style={styles.container}>
      <h1>Manage Students</h1>

      <p>View all students registered on your website.</p>

      <div style={styles.card}>
        <h2>Total Registered Students</h2>
        <p style={styles.number}>{students.length}</p>
      </div>

      <h2>Student List</h2>
      <input
  type="text"
  placeholder="Search student by name or email..."
  value={search}
  onChange={(e) => {
  setSearch(e.target.value);
  setCurrentPage(1);
}}
  style={{
    width: "100%",
    maxWidth: "450px",
    padding: "12px",
    marginBottom: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "15px",
  }}
/>

      {loading ? (
        <p>Loading students...</p>
      ) : message ? (
        <p style={styles.error}>{message}</p>
   ) : students.length === 0 ? (
  <p>No students registered yet.</p>
) : filteredStudents.length === 0 ? (
  <p>No matching students found.</p>
) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cell}>ID</th>
                <th style={styles.cell}>Name</th>
                <th style={styles.cell}>Email</th>
                <th style={styles.cell}>Registration Date</th>
                <th style={styles.cell}>Performance</th>
              </tr>
            </thead>

            <tbody>
             {paginatedStudents.map((student) => (
                <tr key={student.id}>
                  <td style={styles.cell}>{student.id}</td>
                  <td style={styles.cell}>{student.name}</td>
                  <td style={styles.cell}>{student.email}</td>
                  <td style={styles.cell}>
                    {new Date(student.createdAt).toLocaleDateString()}
                  </td>
                  <td style={styles.cell}>
  <button
    onClick={() =>
      router.push(`/admin/student-performance/${student.id}`)
    }
    style={{
      background: "#2563eb",
      color: "white",
      padding: "8px 14px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
    }}
  >
    View Performance
  </button>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filteredStudents.length > 0 && (
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

      <br />

      <a href="/admin-dashboard">← Back to Dashboard</a>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1100px",
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
};
