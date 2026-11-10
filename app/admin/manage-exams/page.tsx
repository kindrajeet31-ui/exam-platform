
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Exam = {
  id: number;
  name: string;
  description: string | null;
  _count: {
    tests: number;
  };
};

export default function ManageExamsPage() {
  const router = useRouter();

  const [exams, setExams] = useState<Exam[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadExams() {
    try {
      const response = await fetch("/api/admin/exams", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        router.replace("/admin-login");
        return;
      }

      if (!response.ok) {
        setMessage(data.error || "Unable to load exams.");
        return;
      }

      setExams(data.exams || []);
    } catch {
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExams();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage(editingId ? "Updating exam..." : "Creating exam...");

    try {
      const response = await fetch("/api/admin/exams", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          name,
          description,
        }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        router.replace("/admin-login");
        return;
      }

      if (!response.ok) {
        setMessage(data.error || "Unable to save exam.");
        return;
      }

      setMessage(
        editingId
          ? "Exam updated successfully!"
          : "Exam created successfully!"
      );

      setName("");
      setDescription("");
      setEditingId(null);

      await loadExams();
    } catch {
      setMessage("Something went wrong.");
    }
  }

  function handleEdit(exam: Exam) {
    setEditingId(exam.id);
    setName(exam.name);
    setDescription(exam.description || "");
    setMessage("Editing exam: " + exam.name);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(exam: Exam) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${exam.name}"?`
      )
    ) {
      return;
    }

    setMessage("Deleting exam...");

    try {
      const response = await fetch("/api/admin/exams", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: exam.id }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        router.replace("/admin-login");
        return;
      }

      if (!response.ok) {
        setMessage(data.error || "Unable to delete exam.");
        return;
      }

      setMessage("Exam deleted successfully!");
      await loadExams();
    } catch {
      setMessage("Unable to delete exam.");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setDescription("");
    setMessage("");
  }

  return (
    <main style={styles.container}>
      <h1>Manage Exams</h1>

      <p>Create exam names and organize multiple sets under each exam.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>{editingId ? "Edit Exam" : "Create New Exam"}</h2>

        <label>Exam Name</label>

        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Example: Bihar General Knowledge"
          required
        />

        <label>Description</label>

        <textarea
          style={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter exam description"
          rows={3}
        />

        <button style={styles.button} type="submit">
          {editingId ? "Update Exam" : "Create Exam"}
        </button>

        {editingId && (
          <button
            style={styles.cancelButton}
            type="button"
            onClick={cancelEdit}
          >
            Cancel Edit
          </button>
        )}

        {message && <p>{message}</p>}
      </form>

      <h2>Existing Exams ({exams.length})</h2>

      {loading ? (
        <p>Loading exams...</p>
      ) : exams.length === 0 ? (
        <p>No exams created yet.</p>
      ) : (
        exams.map((exam) => (
          <div key={exam.id} style={styles.examCard}>
            <h3>{exam.name}</h3>

            <p>{exam.description || "No description"}</p>

            <p>Number of sets: {exam._count.tests}</p>

            <div style={styles.actions}>
              <button
                style={styles.editButton}
                type="button"
                onClick={() => handleEdit(exam)}
              >
                Edit
              </button>

              <button
                style={styles.deleteButton}
                type="button"
                onClick={() => handleDelete(exam)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      <p>
        <a href="/admin-dashboard">← Back to Dashboard</a>
      </p>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "750px",
    margin: "40px auto",
    padding: "25px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    margin: "25px 0",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
  },
  input: {
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "16px",
  },
  button: {
    padding: "14px",
    background: "#174ea6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
  cancelButton: {
    padding: "12px",
    background: "#64748b",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  examCard: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "12px",
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "12px",
  },
  editButton: {
    padding: "9px 18px",
    background: "#174ea6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "9px 18px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
