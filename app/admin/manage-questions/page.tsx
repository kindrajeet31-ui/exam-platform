
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Test = {
  id: number;
  title: string;
};

type Question = {
  id: number;
  subject: string | null;
  topic: string | null;
  questionText: string;
  questionTextHi: string | null;
  optionAHi: string | null;
  optionBHi: string | null;
  optionCHi: string | null;
  optionDHi: string | null;
  explanationHi: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
};

export default function ManageQuestionsPage() {
  const router = useRouter();

  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkTopic, setBulkTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  // Load all mock tests
  useEffect(() => {
    async function loadTests() {
      try {
        const response = await fetch("/api/admin/manage-tests", {
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
  router.replace("/admin-login");
  return;
}

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load tests.");
        }

        setTests(data.tests || []);

        if (data.tests?.length > 0) {
          setSelectedTestId(String(data.tests[0].id));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTests();
  }, [router]);

  // Load questions when a test is selected
  useEffect(() => {
    if (!selectedTestId) {
      setQuestions([]);
      return;
    }

    async function loadQuestions() {
      try {
        setError("");

        const response = await fetch(
          `/api/admin/questions?testId=${selectedTestId}`,
          { cache: "no-store" }
        );

       if (response.status === 401 || response.status === 403) {
  router.replace("/admin-login");
  return;
}

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load questions.");
        }

        setQuestions(data.questions || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      }
    }

    loadQuestions();
  }, [selectedTestId, router]);

  async function deleteQuestion(id: number) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this question?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `/api/admin/questions?id=${id}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

   if (response.status === 401 || response.status === 403) {
  router.replace("/admin-login");
  return;
}

    if (!response.ok) {
      throw new Error(data.error || "Unable to delete question.");
    }

    setQuestions((previous) =>
      previous.filter((question) => question.id !== id)
    );

    setMessage("Question deleted successfully.");
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Something went wrong."
    );
  }
}
function exportQuestionsToCSV() {
  if (filteredQuestions.length === 0) {
    setMessage("No questions available to export.");
    return;
  }

  const headers = [
    "subject",
    "topic",
    "questionText",
    "questionTextHi",
    "optionA",
    "optionAHi",
    "optionB",
    "optionBHi",
    "optionC",
    "optionCHi",
    "optionD",
    "optionDHi",
    "correctAnswer",
    "explanation",
    "explanationHi",
  ];

  const escapeCSV = (value: string | null) =>
    `"${(value || "").replace(/"/g, '""')}"`;

  const rows = filteredQuestions.map((q) =>
    [
      q.subject,
      q.topic,
      q.questionText,
      q.questionTextHi,
      q.optionA,
      q.optionAHi,
      q.optionB,
      q.optionBHi,
      q.optionC,
      q.optionCHi,
      q.optionD,
      q.optionDHi,
      q.correctAnswer,
      q.explanation,
      q.explanationHi,
    ]
      .map(escapeCSV)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "bilingual-questions-export.csv";
  link.click();
  URL.revokeObjectURL(url);

  setMessage(`${filteredQuestions.length} questions exported successfully.`);
}
const filteredQuestions = questions.filter((question) => {
  const matchesSearch = question.questionText
    .toLowerCase()
    .includes(search.toLowerCase());

  const matchesSubject =
    !subjectFilter || question.subject === subjectFilter;

  const matchesTopic =
    !topicFilter ||
    (question.topic || "").toLowerCase().includes(topicFilter.toLowerCase());

  return matchesSearch && matchesSubject && matchesTopic;
});

const totalPages = Math.ceil(
  filteredQuestions.length / questionsPerPage
);

const startIndex = (currentPage - 1) * questionsPerPage;

const paginatedQuestions = filteredQuestions.slice(
  startIndex,
  startIndex + questionsPerPage
);
function toggleQuestion(id: number) {
  setSelectedQuestionIds((previous) =>
    previous.includes(id)
      ? previous.filter((item) => item !== id)
      : [...previous, id]
  );
}

function toggleAllQuestions() {
  const pageIds = paginatedQuestions.map((q) => q.id);

  const allSelected = pageIds.every((id) =>
    selectedQuestionIds.includes(id)
  );

  setSelectedQuestionIds((previous) =>
    allSelected
      ? previous.filter((id) => !pageIds.includes(id))
      : Array.from(new Set([...previous, ...pageIds]))
  );
}

async function saveBulkCategories() {
  if (!bulkSubject || !bulkTopic.trim()) {
    setMessage("Please select a subject and enter a topic.");
    return;
  }

  if (selectedQuestionIds.length === 0) {
    setMessage("Please select at least one question.");
    return;
  }

  try {
    setMessage("");

    const response = await fetch(
      "/api/admin/questions/bulk-update",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: Number(selectedTestId),
          questionIds: selectedQuestionIds,
          subject: bulkSubject,
          topic: bulkTopic.trim(),
        }),
      }
    );

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      router.replace("/admin-login");
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Unable to update categories.");
    }

    setMessage(data.message);
    setSelectedQuestionIds([]);

    const refresh = await fetch(
      `/api/admin/questions?testId=${selectedTestId}`,
      { cache: "no-store" }
    );

    const refreshedData = await refresh.json();

    if (refresh.ok) {
      setQuestions(refreshedData.questions || []);
    }
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : "Something went wrong."
    );
  }
}
  if (loading) {
    return <main style={styles.container}>Loading mock tests...</main>;
  }

  return (
    <main style={styles.container}>
      <h1>Manage Questions</h1>

      <p>Select a mock test to view its questions.</p>

      <div style={styles.navigation}>
        <a href="/admin-dashboard">Admin Dashboard</a>
        {" | "}
        <a href="/admin/questions">Add New Question</a>
      </div>

      <hr />

      <label style={styles.label}>Select Mock Test</label>

      <select
        style={styles.select}
        value={selectedTestId}
        onChange={(e) => setSelectedTestId(e.target.value)}
      >
        {tests.map((test) => (
          <option key={test.id} value={test.id}>
            {test.title}
          </option>
        ))}
      </select>

      {error && <p style={styles.error}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <h2>Questions ({questions.length})</h2>
      <button
  onClick={exportQuestionsToCSV}
  style={{
    ...styles.editButton,
    backgroundColor: "#16a34a",
    marginBottom: "15px",
  }}
>
  Export Filtered Questions to CSV
</button>
      <div style={styles.card}>
  <h3>Bulk Subject & Topic Assignment</h3>

  <p>Selected questions: {selectedQuestionIds.length}</p>

  <button onClick={toggleAllQuestions} style={styles.editButton}>
    Select / Deselect All Questions on This Page
  </button>

  <br /><br />

  <label style={styles.label}>Subject</label>
  <select
    style={styles.select}
    value={bulkSubject}
    onChange={(e) => setBulkSubject(e.target.value)}
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

  <label style={styles.label}>Topic</label>
  <input
    type="text"
    placeholder="Enter topic name"
    value={bulkTopic}
    onChange={(e) => setBulkTopic(e.target.value)}
    style={styles.select}
  />

  <button onClick={saveBulkCategories} style={styles.editButton}>
    Save Categories for Selected Questions
  </button>
</div>
<input
  type="text"
  placeholder="Search questions..."
  value={search}
  onChange={(e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  }}
  style={{
    width: "100%",
    padding: "12px",
    marginBottom: "20px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "15px",
  }}
/>

<select
  style={styles.select}
  value={subjectFilter}
  onChange={(e) => {
    setSubjectFilter(e.target.value);
    setTopicFilter("");
    setCurrentPage(1);
  }}
>
  <option value="">All Subjects</option>
  {[...new Set(questions.map((q) => q.subject).filter(Boolean))].map(
    (subject) => (
      <option key={subject} value={subject!}>
        {subject}
      </option>
    )
  )}
</select>

<input
  type="text"
  placeholder="Filter by topic..."
  value={topicFilter}
  onChange={(e) => {
    setTopicFilter(e.target.value);
    setCurrentPage(1);
  }}
  style={styles.select}
/>
<button
  onClick={() => {
    setSearch("");
    setSubjectFilter("");
    setTopicFilter("");
    setCurrentPage(1);
  }}
  style={styles.editButton}
>
  Clear Filters
</button>

      {tests.length === 0 && <p>No mock tests found.</p>}

      {selectedTestId && questions.length === 0 && !error && (
        <p>No questions found in this test.</p>
      )}

      {paginatedQuestions.map((question, index) => (
        <section key={question.id} style={styles.card}>
          <h3>
         Question {startIndex + index + 1}
          </h3>
          <label style={styles.label}>
          <input
          type="checkbox"
         checked={selectedQuestionIds.includes(question.id)}
         onChange={() => toggleQuestion(question.id)}
           />
          {" "}Select this question
          </label>

          <p>
            <strong>{question.questionText}</strong>
          </p>
          {question.questionTextHi && (
          <p>
           <strong>हिंदी प्रश्न:</strong> {question.questionTextHi}
          </p>
            )}
          <p>
         <strong>Subject:</strong> {question.subject || "Not categorized"}
          </p>

          <p>
          <strong>Topic:</strong> {question.topic || "Not categorized"}
          </p>

          <p>A. {question.optionA}</p>
          <p>B. {question.optionB}</p>
          <p>C. {question.optionC}</p>
          <p>D. {question.optionD}</p>
          {question.optionAHi && <p>क. {question.optionAHi}</p>}
          {question.optionBHi && <p>ख. {question.optionBHi}</p>}
          {question.optionCHi && <p>ग. {question.optionCHi}</p>}
          { question.optionDHi && <p>घ. {question.optionDHi}</p>}

          <p style={styles.correct}>
            Correct Answer: {question.correctAnswer}
          </p>

          <p>
         <strong>Explanation:</strong>{" "}
         {question.explanation || "No explanation added."}
          </p>
          {question.explanationHi && (
           <p>
            <strong>हिंदी व्याख्या:</strong> {question.explanationHi}
           </p>
          )}

<small>Question ID: {question.id}</small>

<div style={styles.actions}>
  <button
    onClick={() =>
      router.push(`/admin/edit-question/${question.id}`)
    }
    style={styles.editButton}
  >
    Edit Question
  </button>

  <button
    onClick={() => deleteQuestion(question.id)}
    style={styles.deleteButton}
  >
    Delete Question
  </button>
</div>
        </section>
      ))}
      {filteredQuestions.length > 0 && (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "15px",
      marginTop: "20px",
      marginBottom: "20px",
    }}
  >
    <button
      onClick={() => setCurrentPage((page) => page - 1)}
      disabled={currentPage === 1}
      style={{ padding: "10px 18px", cursor: "pointer" }}
    >
      Previous
    </button>

    <span>
      Page {currentPage} of {totalPages}
    </span>

    <button
      onClick={() => setCurrentPage((page) => page + 1)}
      disabled={currentPage === totalPages}
      style={{ padding: "10px 18px", cursor: "pointer" }}
    >
      Next
    </button>
  </div>
)}
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "20px",
  },
  navigation: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "bold",
  },
  select: {
    width: "100%",
    padding: "12px",
    marginBottom: "20px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "18px",
    marginBottom: "20px",
  },
  correct: {
    color: "green",
    fontWeight: "bold",
  },
  error: {
    color: "red",
  },
  actions: {
  display: "flex",
  gap: "10px",
  marginTop: "15px",
},

editButton: {
  padding: "10px 16px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
},

deleteButton: {
  padding: "10px 16px",
  backgroundColor: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
},
};
