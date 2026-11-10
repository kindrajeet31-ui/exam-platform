
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type QuestionForm = {
  subject: string;
  topic: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
};
export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();

  const questionId = params.id as string;

  const [form, setForm] = useState<QuestionForm>({
    subject: "",
topic: "",
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    explanation: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load existing question
  useEffect(() => {
    async function loadQuestion() {
      try {
        const response = await fetch(
          `/api/admin/questions/${questionId}`,
          { cache: "no-store" }
        );

     if (response.status === 401 || response.status === 403) {
  router.replace("/admin-login");
  return;
}

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load question.");
        }

        const question = data.question;

setForm({
  subject: question.subject || "",
  topic: question.topic || "",
  questionText: question.questionText,
  optionA: question.optionA,
  optionB: question.optionB,
  optionC: question.optionC,
  optionD: question.optionD,
  correctAnswer: question.correctAnswer,
  explanation: question.explanation || "",
});
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load question."
        );
      } finally {
        setLoading(false);
      }
    }

    loadQuestion();
  }, [questionId, router]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: Number(questionId),
          ...form,
        }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
  router.replace("/admin-login");
  return;
}
      if (!response.ok) {
        throw new Error(data.error || "Unable to update question.");
      }

      setMessage("Question updated successfully!");

      setTimeout(() => {
        router.push("/admin/manage-questions");
      }, 1000);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main style={styles.container}>Loading question...</main>;
  }

  return (
    <main style={styles.container}>
      <h1>Edit Question</h1>

      <p>Question ID: {questionId}</p>

<form onSubmit={handleSubmit}>
  <label style={styles.label}>Subject / विषय</label>
  <select
    name="subject"
    value={form.subject}
    onChange={handleChange}
    style={styles.input}
  >
    <option value="">Select Subject</option>
    <option value="History">History</option>
    <option value="Geography">Geography</option>
    <option value="Polity">Polity</option>
    <option value="General Knowledge">General Knowledge</option>
    <option value="General Science">General Science</option>
    <option value="Mathematics">Mathematics</option>
    <option value="Reasoning">Reasoning</option>
    <option value="Economics">Economics</option>
    <option value="Current Affairs">Current Affairs</option>
  </select>

  <label style={styles.label}>Topic / टॉपिक</label>
  <input
    name="topic"
    value={form.topic}
    onChange={handleChange}
    placeholder="Example: Indian Constitution"
    style={styles.input}
  />

  <label style={styles.label}>Question</label>

        <label style={styles.label}>Option A</label>
        <input
          name="optionA"
          value={form.optionA}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <label style={styles.label}>Option B</label>
        <input
          name="optionB"
          value={form.optionB}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <label style={styles.label}>Option C</label>
        <input
          name="optionC"
          value={form.optionC}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <label style={styles.label}>Option D</label>
        <input
          name="optionD"
          value={form.optionD}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <label style={styles.label}>Correct Answer</label>
        <select
          name="correctAnswer"
          value={form.correctAnswer}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="A">Option A</option>
          <option value="B">Option B</option>
          <option value="C">Option C</option>
          <option value="D">Option D</option>
        </select>

        <label style={styles.label}>Explanation</label>
        <textarea
          name="explanation"
          value={form.explanation}
          onChange={handleChange}
          style={styles.textarea}
        />

        <button type="submit" disabled={saving} style={styles.button}>
          {saving ? "Saving..." : "Update Question"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <p>
        <a href="/admin/manage-questions">
          Back to Manage Questions
        </a>
      </p>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "750px",
    margin: "40px auto",
    padding: "20px",
  },
  label: {
    display: "block",
    marginTop: "15px",
    marginBottom: "6px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  button: {
    marginTop: "20px",
    padding: "12px 22px",
    backgroundColor: "#166534",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
