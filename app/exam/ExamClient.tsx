
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Question = {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionTextHi?: string | null;
  optionAHi?: string | null;
  optionBHi?: string | null;
  optionCHi?: string | null;
  optionDHi?: string | null;
};

type ReviewedAnswer = {
  questionId: number;
  question: string;
  options: string[];
  selectedOption: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
};

export default function ExamPage() {
  const searchParams = useSearchParams();
  const testId = Number(searchParams.get("testId") || 1);

  const [testTitle, setTestTitle] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedQuestions, setMarkedQuestions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reviewedAnswers, setReviewedAnswers] = useState<ReviewedAnswer[]>([]);

const [reportOpen, setReportOpen] = useState(false);
const [reportCategory, setReportCategory] = useState("Incorrect question");
const [reportDescription, setReportDescription] = useState("");
const [reportMessage, setReportMessage] = useState("");
const [reportSubmitting, setReportSubmitting] = useState(false);

  // Load questions
  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoading(true);
        setError("");

        const authResponse = await fetch("/api/me", {
          cache: "no-store",
        });

        if (!authResponse.ok) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch(`/api/tests/${testId}`, {
          cache: "no-store",
        });

        const data = await response.json();

if (!response.ok) {
  if (response.status === 409) {
    setError("You have already completed this exam. Please visit the Results section to view your result.");
    return;
  }

  throw new Error(data.error || "Could not load the test.");
}

        if (!data.success || !data.test || !Array.isArray(data.test.questions)) {
          throw new Error("Invalid test data received.");
        }

        setTestTitle(data.test.title);
        setQuestions(data.test.questions);

        const testDuration = Number(data.test.duration) || 30;
        setDuration(testDuration);
        setTimeLeft(testDuration * 60);
        setCurrentQuestion(0);
      } catch (err) {
        console.error("Test loading error:", err);
        setError(
          err instanceof Error ? err.message : "Unable to load the test."
        );
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [testId]);

  // Submit exam
  async function submitExam() {
    if (submitting || reviewedAnswers.length > 0) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId,
          answers: questions.map((question) => ({
            questionId: question.id,
            selectedOption: answers[question.id] ?? -1,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Submission failed.");
      }

window.location.href = `/exam-result?resultId=${data.resultId}`;
return;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Countdown timer
  useEffect(() => {
    if (
      !examStarted ||
      loading ||
      submitting ||
      message ||
      reviewedAnswers.length > 0
    ) {
      return;
    }

    if (timeLeft <= 0) {
      submitExam();
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((previousTime) => previousTime - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [
    examStarted,
    loading,
    submitting,
    message,
    reviewedAnswers.length,
    timeLeft,
  ]);

  // Select answer
  function selectAnswer(optionIndex: number) {
    const question = questions[currentQuestion];

    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [question.id]: optionIndex,
    }));
  }

  // Loading
  if (loading) {
    return <main className="dashboard-shell">Loading questions...</main>;
  }

// Error
if (error && questions.length === 0) {
  return (
    <main className="dashboard-shell">
      <div
        style={{
          maxWidth: "600px",
          margin: "60px auto",
          padding: "30px",
          background: "#fff3cd",
          border: "1px solid #ffeeba",
          borderRadius: "12px",
          textAlign: "center",
          color: "#856404",
        }}
      >
        <h2>Exam Already Completed</h2>

        <p style={{ marginTop: "15px" }}>
          {error}
        </p>

        <button
          onClick={() => (window.location.href = "/results")}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "7px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          View My Results
        </button>
      </div>
    </main>
  );
}

  // Empty test
  if (questions.length === 0) {
    return <main className="dashboard-shell">No questions available.</main>;
  }

  // Instructions
  if (!examStarted) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-container">
          <section className="results-panel">
            <h1 className="dashboard-title">{testTitle}</h1>
            <h2>Exam Instructions</h2>
            <p>Total Questions: {questions.length}</p>
            <p>Exam Duration: {duration} Minutes</p>

            <button
              className="dashboard-button"
              onClick={() => setExamStarted(true)}
            >
              Start Exam
            </button>
          </section>
        </div>
      </main>
    );
  }

  const question = questions[currentQuestion];

  const options =
    language === "hi"
      ? [
          question.optionAHi || question.optionA,
          question.optionBHi || question.optionB,
          question.optionCHi || question.optionC,
          question.optionDHi || question.optionD,
        ]
      : [
          question.optionA,
          question.optionB,
          question.optionC,
          question.optionD,
        ];

  const answeredCount = Object.keys(answers).length;
  const progress = ((currentQuestion + 1) / questions.length) * 100;
const isMarked = markedQuestions.includes(question.id);

function toggleMarkQuestion() {
  setMarkedQuestions((previous) =>
    previous.includes(question.id)
      ? previous.filter((id) => id !== question.id)
      : [...previous, question.id]
  );
}

async function handleReportSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (reportSubmitting) return;

  setReportSubmitting(true);
  setReportMessage("");

  try {
    const response = await fetch("/api/question-reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionId: question.id,
        category: reportCategory,
        description: reportDescription,
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Unable to submit report.");
    }

    setReportMessage("Report submitted successfully!");
    setReportDescription("");
    setReportOpen(false);
  } catch (err) {
    setReportMessage(
      err instanceof Error ? err.message : "Something went wrong."
    );
  } finally {
    setReportSubmitting(false);
  }
}

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        {/* Exam Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">{testTitle}</h1>
            <p>
              Question {currentQuestion + 1} of {questions.length}
            </p>

            <div
              style={{
                width: "100%",
                height: "10px",
                backgroundColor: "#e5e7eb",
                borderRadius: "10px",
                overflow: "hidden",
                margin: "12px 0",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: "#2563eb",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <p>
              Answered: {answeredCount} / {questions.length}
            </p>
          </div>

          <a href="/results" className="dashboard-button">
            View Results
          </a>
        </header>

        {/* Main exam area and right-side question panel */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: "20px",
          }}
        >
          {/* Left: Question */}
          <section
            className="results-panel"
            style={{
              flex: "1 1 550px",
              minWidth: 0,
            }}
          >
            <p
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: timeLeft < 300 ? "red" : "#172033",
              }}
            >
              Time Remaining:{" "}
              {Math.floor(timeLeft / 60).toString().padStart(2, "0")}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </p>

            {/* Language Selection */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <button
                type="button"
                className="dashboard-button"
                onClick={() => setLanguage("en")}
                style={{ opacity: language === "en" ? 0.6 : 1 }}
              >
                English
              </button>

              <button
                type="button"
                className="dashboard-button"
                onClick={() => setLanguage("hi")}
                style={{ opacity: language === "hi" ? 0.6 : 1 }}
              >
                हिन्दी
              </button>
            </div>

            {reviewedAnswers.length > 0 && (
              <button
                className="dashboard-button"
                style={{ marginBottom: "20px" }}
                onClick={() => window.location.reload()}
              >
                Retake Exam
              </button>
            )}

            <h2 className="results-heading">
              {language === "hi" && question.questionTextHi
                ? question.questionTextHi
                : question.questionText}
            </h2>
            <button
  type="button"
  onClick={toggleMarkQuestion}
  disabled={submitting || reviewedAnswers.length > 0}
  style={{
    padding: "10px 16px",
    marginBottom: "15px",
    borderRadius: "7px",
    border: "1px solid #9333ea",
    background: isMarked ? "#9333ea" : "#f3e8ff",
    color: isMarked ? "white" : "#7e22ce",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  {isMarked ? "★ Marked for Review" : "☆ Mark for Review"}
</button>

<div style={{ marginBottom: "20px" }}>
  <button
    type="button"
    onClick={() => setReportOpen(!reportOpen)}
    disabled={submitting || reviewedAnswers.length > 0}
    style={{
      padding: "10px 16px",
      borderRadius: "7px",
      border: "1px solid #dc2626",
      background: "#fef2f2",
      color: "#b91c1c",
      fontWeight: "bold",
      cursor: "pointer",
    }}
  >
    ⚑ Report Question
  </button>

  {reportOpen && (
    <form
      onSubmit={handleReportSubmit}
      style={{
        marginTop: "12px",
        padding: "15px",
        border: "1px solid #fecaca",
        borderRadius: "8px",
      }}
    >
      <h3>Report a Problem</h3>

      <label>Select Problem</label>

      <select
        value={reportCategory}
        onChange={(e) => setReportCategory(e.target.value)}
        style={{
          display: "block",
          width: "100%",
          padding: "10px",
          margin: "8px 0 15px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      >
        <option value="Incorrect question">Incorrect question</option>
        <option value="Wrong answer">Wrong answer</option>
        <option value="Incorrect Hindi translation">
          Incorrect Hindi translation
        </option>
        <option value="Typing mistake">Typing mistake</option>
        <option value="Other">Other</option>
      </select>

      <label>Describe the problem (optional)</label>

      <textarea
        value={reportDescription}
        onChange={(e) => setReportDescription(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Explain what is wrong..."
        style={{
          display: "block",
          width: "100%",
          padding: "10px",
          margin: "8px 0 15px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      <button
        type="submit"
        disabled={reportSubmitting}
        className="dashboard-button"
      >
        {reportSubmitting ? "Submitting..." : "Submit Report"}
      </button>

      <button
        type="button"
        onClick={() => setReportOpen(false)}
        style={{
          marginLeft: "10px",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
    </form>
  )}

  {reportMessage && (
    <p style={{ color: reportMessage.includes("successfully") ? "green" : "red" }}>
      {reportMessage}
    </p>
  )}
</div>

            {/* Answer Options */}
            <div>
              {options.map((option, index) => (
                <label
                  key={index}
                  style={{
                    display: "block",
                    padding: "15px",
                    marginBottom: "12px",
                    border: "1px solid #e5eaf2",
                    borderRadius: "9px",
                    cursor: "pointer",
                    background:
                      answers[question.id] === index ? "#eaf0ff" : "#fff",
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={answers[question.id] === index}
                    onChange={() => selectAnswer(index)}
                    disabled={submitting || reviewedAnswers.length > 0}
                  />{" "}
                  {option}
                </label>
              ))}
            </div>

            {/* Previous, Next and Submit */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                marginTop: "25px",
                flexWrap: "wrap",
              }}
            >
              <button
                className="dashboard-button"
                disabled={
                  currentQuestion === 0 ||
                  submitting ||
                  reviewedAnswers.length > 0
                }
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
              >
                Previous
              </button>

              {currentQuestion < questions.length - 1 && (
                <button
                  className="dashboard-button"
                  disabled={submitting || reviewedAnswers.length > 0}
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                >
                  Next
                </button>
              )}

              <button
                className="dashboard-button"
                disabled={submitting || reviewedAnswers.length > 0}
                onClick={() => {
                  const unanswered = questions.length - answeredCount;

                  const confirmSubmit = window.confirm(
                    `You have ${unanswered} unanswered questions. Are you sure you want to submit?`
                  );

                  if (confirmSubmit) {
                    submitExam();
                  }
                }}
              >
                {submitting ? "Submitting..." : "Submit Exam"}
              </button>
            </div>

            {message && (
              <p style={{ color: "green", marginTop: "20px" }}>{message}</p>
            )}

{error && (
  <div
    style={{
      backgroundColor: "#fff3cd",
      color: "#856404",
      padding: "20px",
      borderRadius: "10px",
      marginTop: "20px",
      textAlign: "center",
      border: "1px solid #ffeeba",
    }}
  >
    <h2>Exam Already Completed</h2>

    <p style={{ marginTop: "10px" }}>
      You have already completed this exam. You can view your result below.
    </p>

    <button
      type="button"
      onClick={() => {
        window.location.href = "/results";
      }}
      style={{
        display: "inline-block",
        marginTop: "15px",
        padding: "12px 24px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      View My Results
    </button>
  </div>
)}
          </section>

          {/* Right: Question Number Navigation */}
          <aside
            className="results-panel"
            style={{
              flex: "0 1 280px",
              minWidth: "240px",
              position: "sticky",
              top: "20px",
            }}
          >
            <h2 style={{ marginBottom: "8px" }}>Question Navigation</h2>

            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "15px" }}>
              Click a number to open that question.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: "8px",
                maxHeight: "420px",
                overflowY: "auto",
                padding: "3px",
              }}
            >
              {questions.map((item, index) => {
                const isCurrent = currentQuestion === index;
                const isAnswered = answers[item.id] !== undefined;
                const isMarkedQuestion = markedQuestions.includes(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentQuestion(index)}
                    disabled={submitting || reviewedAnswers.length > 0}
                    style={{
                      minWidth: 0,
                      padding: "10px 4px",
backgroundColor: isCurrent
  ? "#2563eb"
  : isMarkedQuestion
    ? "#9333ea"
    : isAnswered
      ? "#16a34a"
      : "#e5e7eb",
color:
  isCurrent || isMarkedQuestion || isAnswered
    ? "white"
    : "#172033",
                      border: isCurrent ? "2px solid #1d4ed8" : "1px solid #d1d5db",
                      borderRadius: "7px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "18px",
                fontSize: "12px",
              }}
            >
<span><span style={{ color: "#2563eb" }}>●</span> Current</span>
<span><span style={{ color: "#16a34a" }}>●</span> Answered</span>
<span><span style={{ color: "#9333ea" }}>●</span> Marked</span>
<span><span style={{ color: "#9ca3af" }}>●</span> Not answered</span>
            </div>
          </aside>
        </div>

        {/* Exam Performance Summary */}
        {reviewedAnswers.length > 0 && (
          <section className="results-panel" style={{ marginTop: "25px" }}>
            <h2 className="results-heading">Your Exam Performance</h2>

            {(() => {
              const total = reviewedAnswers.length;
              const correct = reviewedAnswers.filter(
                (answer) => answer.isCorrect
              ).length;
              const incorrect = reviewedAnswers.filter(
                (answer) =>
                  answer.selectedOption !== -1 && !answer.isCorrect
              ).length;
              const unanswered = reviewedAnswers.filter(
                (answer) => answer.selectedOption === -1
              ).length;

              const percentage =
                total > 0 ? Math.round((correct / total) * 100) : 0;

              return (
                <>
                  <h2 style={{ fontSize: "32px", color: "#2563eb" }}>
                    {correct} / {total}
                  </h2>
                  <p>Final Score: {percentage}%</p>
                  <p>Total Questions: {total}</p>
                  <p style={{ color: "green" }}>Correct Answers: {correct}</p>
                  <p style={{ color: "red" }}>Incorrect Answers: {incorrect}</p>
                  <p>Unanswered Questions: {unanswered}</p>
                </>
              );
            })()}
          </section>
        )}

        {/* Answer Review */}
        {reviewedAnswers.length > 0 && (
          <section className="results-panel" style={{ marginTop: "25px" }}>
            <h2 className="results-heading">Answer Review</h2>

            {reviewedAnswers.map((answer) => (
              <div
                key={answer.questionId}
                style={{
                  padding: "15px",
                  marginBottom: "15px",
                  border: "1px solid #e5eaf2",
                  borderRadius: "9px",
                }}
              >
                <h3>{answer.question}</h3>

                <p style={{ color: answer.isCorrect ? "green" : "red" }}>
                  {answer.isCorrect ? "Correct answer!" : "Incorrect answer"}
                </p>

                <p>
                  Your answer:{" "}
                  {answer.selectedOption === -1
                    ? "Not answered"
                    : answer.options[answer.selectedOption]}
                </p>

                <p>
                  Correct answer: {answer.options[answer.correctAnswer]}
                </p>

                {answer.explanation && <p>Explanation: {answer.explanation}</p>}
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
