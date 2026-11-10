
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Exam = {
  id: number;
  name: string;
};

export default function CreateTestPage() {
  const router = useRouter();

  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState("");
  const [setNumber, setSetNumber] = useState("1");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [isPublished, setIsPublished] = useState(true);
const [availableFrom, setAvailableFrom] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
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

        if (response.ok) {
          setExams(data.exams || []);
        } else {
          setMessage(data.error || "Unable to load exams.");
        }
      } catch {
        setMessage("Unable to load exam names.");
      }
    }

    loadExams();
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Saving test...");

    try {
      const response = await fetch("/api/admin/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          duration: Number(duration),
          examId: Number(examId),
          setNumber: Number(setNumber),
          isPublished,
availableFrom: availableFrom
  ? new Date(availableFrom).toISOString()
  : null,
        }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        router.replace("/admin-login");
        return;
      }

      if (!response.ok) {
        setMessage(data.error || "Unable to create test.");
        return;
      }

      setMessage("Mock test created successfully!");
      setTitle("");
      setDescription("");
      setDuration("30");
      setSetNumber("1");
    } catch {
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <main style={styles.container}>
      <h1>Create New Mock Test</h1>
      <p>Select an exam and create one of its sets.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label>Exam Name</label>

        <select
          style={styles.input}
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          required
        >
          <option value="">Select an exam</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name}
            </option>
          ))}
        </select>

        {exams.length === 0 && (
          <p>Please create an exam first in Manage Exams.</p>
        )}

        <label>Set Number</label>

        <input
          style={styles.input}
          type="number"
          min="1"
          value={setNumber}
          onChange={(e) => setSetNumber(e.target.value)}
          required
        />

        <label>Test Title</label>

        <input
          style={styles.input}
          type="text"
          placeholder="Example: Bihar General Knowledge Set 1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Test Description</label>

        <textarea
          style={styles.input}
          placeholder="Enter test details"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        <label>Exam Duration (Minutes)</label>

        <input
          style={styles.input}
          type="number"
          min="1"
          max="300"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
        />

        <button
          style={styles.button}
          type="submit"
          disabled={exams.length === 0}
        >
          <label>Test Availability</label>

<select
  style={styles.input}
  value={isPublished ? "published" : "scheduled"}
  onChange={(e) => {
    setIsPublished(e.target.value === "published");
  }}
>
  <option value="published">Publish Immediately</option>
  <option value="scheduled">Schedule for Later</option>
</select>

{!isPublished && (
  <>
    <label>Release Date and Time</label>

    <input
      style={styles.input}
      type="datetime-local"
      value={availableFrom}
      onChange={(e) => setAvailableFrom(e.target.value)}
      required
    />
  </>
)}
          Create Mock Test
        </button>

        {message && <p>{message}</p>}
      </form>

      <a href="/admin-dashboard">← Back to Dashboard</a>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "650px",
    margin: "40px auto",
    padding: "25px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "25px",
    marginBottom: "25px",
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
};
