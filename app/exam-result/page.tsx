
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ReviewedAnswer = {
  questionId: number;
  subject: string;
  topic: string;
  question: string;
  questionHi: string | null;
  options: string[];
  optionsHi: (string | null)[];
  selectedOption: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
  explanationHi: string;
};

type ExamResult = {
  resultId: number;
  testTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  correct: number;
  wrong: number;
  unattempted: number;
  reviewedAnswers: ReviewedAnswer[];
};

function ExamResultContent() {
  const searchParams = useSearchParams();
  const resultId = searchParams.get("resultId");

  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [questionFilter, setQuestionFilter] = useState<
  "all" | "correct" | "wrong" | "unattempted"
>("all");
const [activeQuestion, setActiveQuestion] = useState(0);
  useEffect(() => {
    async function loadResult() {
      try {
        if (!resultId) {
          throw new Error("Result ID is missing.");
        }

        const response = await fetch(
          `/api/exam-result?resultId=${resultId}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load result.");
        }

        setResult(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [resultId]);

  if (loading) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-container">Loading your result...</div>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-container">
          <section className="results-panel">
            <h2>Unable to load result</h2>
            <p style={{ color: "red" }}>{error}</p>
            <a href="/tests" className="dashboard-button">
              Back to Mock Tests
            </a>
          </section>
        </div>
      </main>
    );
  }

  const letters = ["A", "B", "C", "D"];
  const subjectStats = Object.values(
  result.reviewedAnswers.reduce<
    Record<string, { total: number; correct: number; wrong: number; unattempted: number }>
  >((stats, answer) => {
    const subject = answer.subject || "Not categorized";

    if (!stats[subject]) {
      stats[subject] = {
        total: 0,
        correct: 0,
        wrong: 0,
        unattempted: 0,
      };
    }

    stats[subject].total++;

    if (answer.isCorrect) {
      stats[subject].correct++;
    } else if (answer.selectedOption === -1) {
      stats[subject].unattempted++;
    } else {
      stats[subject].wrong++;
    }

    return stats;
  }, {})
);

const topicStats = Object.entries(
  result.reviewedAnswers.reduce<
    Record<string, { total: number; correct: number; wrong: number; unattempted: number }>
  >((stats, answer) => {
    const key = `${answer.subject || "Not categorized"} - ${answer.topic || "Not categorized"}`;

    if (!stats[key]) {
      stats[key] = {
        total: 0,
        correct: 0,
        wrong: 0,
        unattempted: 0,
      };
    }

    stats[key].total++;

    if (answer.isCorrect) {
      stats[key].correct++;
    } else if (answer.selectedOption === -1) {
      stats[key].unattempted++;
    } else {
      stats[key].wrong++;
    }

    return stats;
  }, {})
);

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Exam Result</h1>
            <p className="dashboard-subtitle">{result.testTitle}</p>
          </div>
        </header>

        <section className="results-panel">
          <h2 style={{ color: "#16a34a", textAlign: "center" }}>
            Exam Submitted Successfully!
          </h2>

          <h2 style={{ textAlign: "center", marginTop: "15px" }}>
            Your Performance Summary
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "15px",
              marginTop: "25px",
            }}
          >
            <div style={{ padding: "20px", background: "#eff6ff", borderRadius: "12px" }}>
              <p>Total Score</p>
              <h2 style={{ fontSize: "30px", color: "#2563eb" }}>
                {result.score}/{result.totalQuestions}
              </h2>
            </div>

            <div style={{ padding: "20px", background: "#f0fdf4", borderRadius: "12px" }}>
              <p>Correct Answers</p>
              <h2 style={{ fontSize: "30px", color: "#16a34a" }}>
                {result.correct}
              </h2>
            </div>

            <div style={{ padding: "20px", background: "#fef2f2", borderRadius: "12px" }}>
              <p>Wrong Answers</p>
              <h2 style={{ fontSize: "30px", color: "#dc2626" }}>
                {result.wrong}
              </h2>
            </div>

            <div style={{ padding: "20px", background: "#fff7ed", borderRadius: "12px" }}>
              <p>Not Attempted</p>
              <h2 style={{ fontSize: "30px", color: "#ea580c" }}>
                {result.unattempted}
              </h2>
            </div>

            <div style={{ padding: "20px", background: "#faf5ff", borderRadius: "12px" }}>
              <p>Accuracy</p>
              <h2 style={{ fontSize: "30px", color: "#9333ea" }}>
                {result.percentage}%
              </h2>
            </div>
          </div>

          <div style={{ marginTop: "30px", textAlign: "center" }}>
                      <div
            style={{
              marginTop: "25px",
              padding: "20px",
              background: "#f8fafc",
              borderRadius: "12px",
            }}
          >
            <h3 style={{ marginBottom: "15px" }}>
              Answer Progress
            </h3>

            <div
              style={{
                display: "flex",
                height: "18px",
                width: "100%",
                overflow: "hidden",
                borderRadius: "20px",
                background: "#e2e8f0",
              }}
            >
              <div
                style={{
                  width: `${(result.correct / result.totalQuestions) * 100}%`,
                  background: "#16a34a",
                }}
              />
              <div
                style={{
                  width: `${(result.wrong / result.totalQuestions) * 100}%`,
                  background: "#dc2626",
                }}
              />
              <div
                style={{
                  width: `${(result.unattempted / result.totalQuestions) * 100}%`,
                  background: "#f97316",
                }}
              />
            </div>

            <p style={{ marginTop: "12px", fontSize: "13px", color: "#64748b" }}>
              <span style={{ color: "#16a34a" }}>● Correct</span>{" "}
              <span style={{ color: "#dc2626", marginLeft: "12px" }}>● Wrong</span>{" "}
              <span style={{ color: "#f97316", marginLeft: "12px" }}>● Unattempted</span>
            </p>
          </div>
            <div style={{ marginTop: "30px" }}>
  <h2>Topic-wise Performance</h2>
  <p style={{ color: "#64748b", marginTop: "8px" }}>
    See which topics need more practice.
  </p>

  {topicStats.length === 0 ? (
    <p>No topic data available.</p>
  ) : (
    topicStats.map(([topicName, item]) => (
      <div
        key={topicName}
        style={{
          padding: "15px",
          marginTop: "12px",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
        }}
      >
        <h3>{topicName}</h3>
        <p>
          Correct: {item.correct} | Wrong: {item.wrong} |
          Not attempted: {item.unattempted}
        </p>
        <p>
          Accuracy: {Math.round((item.correct / item.total) * 100)}%
        </p>
      </div>
    ))
  )}
</div>
<button
  type="button"
  onClick={() => window.print()}
  style={{
    padding: "12px 22px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: "20px",
  }}
>
  Download Result as PDF
</button>
            <h2>Question-wise Answer Analysis</h2>
            <div style={{ marginTop: "35px" }}>
  <h2>Subject-wise Performance</h2>
  <p style={{ color: "#64748b", marginTop: "8px" }}>
    Identify your strong and weak subjects.
  </p>

  {subjectStats.length === 0 ? (
    <p>No subject data available.</p>
  ) : (
    subjectStats.map((item, index) => (
      <div
        key={index}
        style={{
          padding: "15px",
          marginTop: "12px",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
        }}
      >
        <h3>{Object.keys(
          result.reviewedAnswers.reduce<Record<string, boolean>>((acc, answer) => {
            acc[answer.subject || "Not categorized"] = true;
            return acc;
          }, {})
        )[index]}</h3>

        <p>
          Correct: {item.correct} | Wrong: {item.wrong} |
          Not attempted: {item.unattempted}
        </p>

        <p>
          Accuracy: {Math.round((item.correct / item.total) * 100)}%
        </p>
      </div>
    ))
  )}
</div>
            <p style={{ color: "#64748b", marginTop: "8px" }}>
              Check your mistakes and learn the correct answers.
            </p>

            <div style={{ marginTop: "15px", display: "flex", justifyContent: "center", gap: "10px" }}>
              <button
                className="dashboard-button"
                onClick={() => setLanguage("en")}
                style={{ opacity: language === "en" ? 0.65 : 1 }}
              >
                English
              </button>

              <button
                className="dashboard-button"
                onClick={() => setLanguage("hi")}
                style={{ opacity: language === "hi" ? 0.65 : 1 }}
              >
                हिन्दी
              </button>
            </div>
          </div>

          <div style={{ marginTop: "25px" }}>
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginBottom: "20px",
    }}
  >
    {(["all", "correct", "wrong", "unattempted"] as const).map((filter) => (
      <button
        key={filter}
        type="button"
        onClick={() => setQuestionFilter(filter)}
        style={{
          padding: "10px 16px",
          borderRadius: "7px",
          border: "1px solid #2563eb",
          background: questionFilter === filter ? "#2563eb" : "white",
          color: questionFilter === filter ? "white" : "#2563eb",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {{
          all: `All (${result.reviewedAnswers.length})`,
          correct: `Correct (${result.correct})`,
          wrong: `Wrong (${result.wrong})`,
          unattempted: `Unattempted (${result.unattempted})`,
        }[filter]}
      </button>
    ))}
  </div>

  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginBottom: "20px",
      padding: "15px",
      background: "#f8fafc",
      borderRadius: "10px",
    }}
  >
    {result.reviewedAnswers.map((answer, index) => (
      <button
        key={answer.questionId}
        type="button"
        onClick={() => {
          setActiveQuestion(index);
          document
            .getElementById(`review-question-${answer.questionId}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "7px",
          border: activeQuestion === index ? "3px solid #1d4ed8" : "1px solid #cbd5e1",
          cursor: "pointer",
          fontWeight: "bold",
          background: answer.selectedOption === -1
            ? "#fed7aa"
            : answer.isCorrect
              ? "#bbf7d0"
              : "#fecaca",
          color: "#1e293b",
        }}
      >
        {index + 1}
      </button>
    ))}
  </div>

{result.reviewedAnswers
  .filter((answer) => {
    if (questionFilter === "correct") return answer.isCorrect;

    if (questionFilter === "wrong")
      return answer.selectedOption !== -1 && !answer.isCorrect;

    if (questionFilter === "unattempted")
      return answer.selectedOption === -1;

    return true;
  })
  .map((answer) => {
    const index = result.reviewedAnswers.findIndex(
      (item) => item.questionId === answer.questionId
    );

    const questionText =
      language === "hi" && answer.questionHi
        ? answer.questionHi
        : answer.question;

    const explanation =
      language === "hi" && answer.explanationHi
        ? answer.explanationHi
        : answer.explanation;

    return (
<article
  id={`review-question-${answer.questionId}`}
  key={answer.questionId}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "18px",
                    background: answer.selectedOption === -1 ? "#fff7ed" : answer.isCorrect ? "#f0fdf4" : "#fef2f2",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                    <h3>Question {index + 1}</h3>

                    <strong
                      style={{
                        color: answer.selectedOption === -1 ? "#c2410c" : answer.isCorrect ? "#15803d" : "#dc2626",
                      }}
                    >
                      {answer.selectedOption === -1
                        ? "Not Attempted"
                        : answer.isCorrect
                        ? "Correct"
                        : "Wrong"}
                    </strong>
                  </div>

                  <p style={{ fontWeight: "600", margin: "15px 0" }}>
                    {questionText}
                  </p>

                  {answer.options.map((option, optionIndex) => {
                    const optionText =
                      language === "hi" && answer.optionsHi[optionIndex]
                        ? answer.optionsHi[optionIndex]
                        : option;

                    const isCorrectOption =
                      optionIndex === answer.correctAnswer;

                    const isSelected =
                      optionIndex === answer.selectedOption;

                    return (
                      <div
                        key={optionIndex}
                        style={{
                          padding: "10px",
                          marginBottom: "8px",
                          borderRadius: "8px",
                          border: isCorrectOption
                            ? "2px solid #16a34a"
                            : isSelected
                            ? "2px solid #dc2626"
                            : "1px solid #e2e8f0",
                          background: isCorrectOption
                            ? "#dcfce7"
                            : isSelected
                            ? "#fee2e2"
                            : "white",
                        }}
                      >
                        <strong>{letters[optionIndex]}.</strong> {optionText}
                        {isCorrectOption && (
                          <strong style={{ color: "#15803d" }}> — Correct Answer</strong>
                        )}
                        {isSelected && !isCorrectOption && (
                          <strong style={{ color: "#dc2626" }}> — Your Answer</strong>
                        )}
                        {isSelected && isCorrectOption && (
                          <strong style={{ color: "#15803d" }}> — Your Answer</strong>
                        )}
                      </div>
                    );
                  })}

                  <div style={{ marginTop: "15px" }}>
                    <strong>Explanation:</strong>
                    <p style={{ marginTop: "5px" }}>
                      {explanation || "No explanation available for this question."}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div style={{ marginTop: "30px", display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <a href="/tests" className="dashboard-button">
              Take Another Test
            </a>

            <a href="/student" className="dashboard-button">
              Student Dashboard
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ExamResultPage() {
  return (
    <Suspense fallback={<main className="dashboard-shell">Loading result...</main>}>
      <ExamResultContent />
    </Suspense>
  );
}
