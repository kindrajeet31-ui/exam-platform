
"use client";

import { useEffect, useState } from "react";

type Test = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  questionCount: number;
  availableFrom: string | null;
  isPublished: boolean;
  isAvailable: boolean;
};

type ExamSet = Test & {
  setNumber: number | null;
};

type Exam = {
  id: number;
  name: string;
  description: string | null;
  sets: ExamSet[];
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    padding: "32px 16px",
    color: "#0f172a",
  } as const,
  container: {
    maxWidth: "1150px",
    margin: "0 auto",
  } as const,
  header: {
    background: "linear-gradient(120deg, #0f2d59, #1d4ed8)",
    color: "white",
    borderRadius: "20px",
    padding: "30px",
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "18px",
  },
  panel: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 5px 20px rgba(15, 23, 42, 0.04)",
  } as const,
  button: {
    display: "inline-block",
    background: "#2563eb",
    color: "white",
    padding: "11px 18px",
    borderRadius: "9px",
    textDecoration: "none",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  } as const,
  muted: {
    color: "#64748b",
    fontSize: "14px",
  } as const,
};

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedExam, setSelectedExam] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const testsPerPage = 10;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchTests() {
      try {
        const authResponse = await fetch("/api/me", {
          cache: "no-store",
        });

        if (authResponse.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!authResponse.ok) {
          throw new Error("Could not verify student login.");
        }

        const response = await fetch("/api/tests", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load tests.");
        }

        setTests(data.tests || []);
        setExams(data.exams || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTests();
  }, []);

  function getCountdown(date: string) {
    const remaining = Math.max(
      0,
      new Date(date).getTime() - currentTime
    );

    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  function isSetAvailable(set: ExamSet) {
    return (
      set.isPublished ||
      (!!set.availableFrom &&
        new Date(set.availableFrom).getTime() <= currentTime)
    );
  }

  function isTestAvailable(test: Test) {
    return (
      test.isPublished ||
      (!!test.availableFrom &&
        new Date(test.availableFrom).getTime() <= currentTime)
    );
  }

  const groupedTestIds = new Set(
    exams.flatMap((exam) => exam.sets.map((set) => set.id))
  );

  const oldTests = tests.filter((test) => !groupedTestIds.has(test.id));

  const searchText = search.trim().toLowerCase();

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.name.toLowerCase().includes(searchText) ||
      exam.sets.some((set) =>
        set.title.toLowerCase().includes(searchText)
      );

    const matchesCategory =
      selectedExam === "all" || exam.id.toString() === selectedExam;

    return matchesSearch && matchesCategory;
  });

  const filteredTests = oldTests.filter((test) =>
    test.title.toLowerCase().includes(searchText)
  );

  const totalPages = Math.ceil(filteredTests.length / testsPerPage);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIndex = (safePage - 1) * testsPerPage;
  const paginatedTests = filteredTests.slice(
    startIndex,
    startIndex + testsPerPage
  );

  const totalSets = exams.reduce(
    (total, exam) => total + exam.sets.length,
    0
  );

  const availableSets = exams.reduce(
    (total, exam) =>
      total + exam.sets.filter(isSetAvailable).length,
    0
  );

  const cardStyle = {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "18px",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  };

  function Status({ available, soon }: { available: boolean; soon?: boolean }) {
    const color = available
      ? "#15803d"
      : soon
        ? "#b45309"
        : "#b91c1c";

    const background = available
      ? "#dcfce7"
      : soon
        ? "#fef3c7"
        : "#fee2e2";

    const label = available
      ? "Available Now"
      : soon
        ? "Available Soon"
        : "Not Published";

    return (
      <span
        style={{
          display: "inline-block",
          width: "fit-content",
          padding: "6px 11px",
          borderRadius: "30px",
          background,
          color,
          fontSize: "12px",
          fontWeight: 800,
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <p
              style={{
                margin: "0 0 8px",
                color: "#bfdbfe",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "1.5px",
              }}
            >
              STATE SSC & PCS PREPARATION
            </p>
            <h1 style={{ margin: 0, fontSize: "clamp(25px, 4vw, 36px)" }}>
              Available Mock Tests
            </h1>
            <p style={{ color: "#dbeafe", margin: "10px 0 0" }}>
              Choose your exam, practice regularly and improve your score.
            </p>
          </div>

          <a
            href="/"
            style={{
              ...styles.button,
              background: "white",
              color: "#1d4ed8",
            }}
          >
            ← Home
          </a>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          {[
            { label: "Exam Categories", value: exams.length },
            { label: "Total Exam Sets", value: totalSets },
            { label: "Available Sets", value: availableSets },
            { label: "Other Mock Tests", value: oldTests.length },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "18px",
              }}
            >
              <p style={{ ...styles.muted, margin: 0 }}>{item.label}</p>
              <h2 style={{ margin: "8px 0 0", fontSize: "28px" }}>
                {item.value}
              </h2>
            </div>
          ))}
        </section>

        <section style={styles.panel}>
          <div style={{ marginBottom: "22px" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "21px" }}>
              Find Your Mock Test
            </h2>
            <p style={{ ...styles.muted, margin: 0 }}>
              Search by exam name or set title.
            </p>
          </div>

          <input
            type="search"
            placeholder="Search exams or mock tests..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 16px",
              marginBottom: "18px",
              border: "1px solid #cbd5e1",
              borderRadius: "11px",
              fontSize: "16px",
              outlineColor: "#2563eb",
            }}
          />

          {!loading && !error && exams.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "9px",
                marginBottom: "24px",
              }}
            >
              {[
                { id: "all", name: "All Exams" },
                ...exams.map((exam) => ({
                  id: exam.id.toString(),
                  name: exam.name,
                })),
              ].map((item) => {
                const active = selectedExam === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedExam(item.id);
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: "10px 15px",
                      borderRadius: "30px",
                      border: active
                        ? "1px solid #1d4ed8"
                        : "1px solid #cbd5e1",
                      background: active ? "#1d4ed8" : "white",
                      color: active ? "white" : "#334155",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          )}

          {loading && (
            <div style={{ padding: "35px", textAlign: "center" }}>
              <p style={{ color: "#475569" }}>Loading exams and tests...</p>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                background: "#fee2e2",
                color: "#991b1b",
              }}
            >
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            filteredExams.length === 0 &&
            (selectedExam !== "all" || filteredTests.length === 0) && (
              <div
                style={{
                  padding: "35px 15px",
                  textAlign: "center",
                  background: "#f8fafc",
                  borderRadius: "12px",
                }}
              >
                <h3>No matching exams or tests found.</h3>
                <p style={styles.muted}>
                  Try another search or select All Exams.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            filteredExams.map((exam) => (
              <div
                key={exam.id}
                style={{
                  marginBottom: "24px",
                  border: "1px solid #dbeafe",
                  borderRadius: "16px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "19px 20px",
                    background: "#eff6ff",
                    borderBottom: "1px solid #dbeafe",
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: "21px" }}>
                    {exam.name}
                  </h2>
                  <p
                    style={{
                      color: "#475569",
                      margin: "7px 0 0",
                      fontSize: "14px",
                    }}
                  >
                    {exam.description ||
                      "Choose an exam set to start practicing."}
                  </p>
                  <p
                    style={{
                      color: "#1d4ed8",
                      fontWeight: 700,
                      fontSize: "13px",
                      margin: "10px 0 0",
                    }}
                  >
                    {exam.sets.length} exam set(s)
                  </p>
                </div>

                <div
                  style={{
                    padding: "18px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "14px",
                  }}
                >
                  {exam.sets.length === 0 ? (
                    <p style={styles.muted}>No sets available yet.</p>
                  ) : (
                    exam.sets.map((set, index) => {
                      const available = isSetAvailable(set);
                      const soon =
                        !set.isPublished && !!set.availableFrom;

                      return (
                        <article key={set.id} style={cardStyle}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span
                              style={{
                                color: "#1d4ed8",
                                fontSize: "12px",
                                fontWeight: 800,
                              }}
                            >
                              SET {set.setNumber ?? index + 1}
                            </span>
                            {set.questionCount > 0 && (
                              <Status available={available} soon={soon} />
                            )}
                          </div>

                          <h3 style={{ margin: 0, fontSize: "17px" }}>
                            {set.title}
                          </h3>

                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "12px",
                              color: "#64748b",
                              fontSize: "13px",
                            }}
                          >
                            <span>📝 {set.questionCount} Questions</span>
                            <span>⏱ {set.duration} Minutes</span>
                          </div>

                          {set.questionCount === 0 ? (
                            <p
                              style={{
                                color: "#b91c1c",
                                fontWeight: 700,
                                fontSize: "13px",
                              }}
                            >
                              No Questions Available
                            </p>
                          ) : available ? (
                            <a
                              href={`/exam?testId=${set.id}`}
                              style={{ ...styles.button, textAlign: "center" }}
                            >
                              Start Exam →
                            </a>
                          ) : soon ? (
                            <div
                              style={{
                                background: "#fffbeb",
                                borderRadius: "9px",
                                padding: "11px",
                                color: "#92400e",
                                fontSize: "13px",
                              }}
                            >
                              <strong>Releases on:</strong>
                              <p style={{ margin: "5px 0" }}>
                                {new Date(set.availableFrom!).toLocaleString(
                                  "en-IN"
                                )}
                              </p>
                              <strong>Releases in:</strong>
                              <p
                                style={{
                                  margin: "5px 0 0",
                                  fontWeight: 800,
                                  fontSize: "15px",
                                }}
                              >
                                {getCountdown(set.availableFrom!)}
                              </p>
                            </div>
                          ) : (
                            <Status available={false} />
                          )}
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            ))}

          {!loading &&
            !error &&
            selectedExam === "all" &&
            filteredTests.length > 0 && (
              <div style={{ marginTop: "28px" }}>
                <h2 style={{ fontSize: "21px", marginBottom: "15px" }}>
                  Other Mock Tests
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "14px",
                  }}
                >
                  {paginatedTests.map((test) => {
                    const available = isTestAvailable(test);
                    const soon =
                      !test.isPublished && !!test.availableFrom;

                    return (
                      <article key={test.id} style={cardStyle}>
                        <Status available={available} soon={soon} />

                        <h3 style={{ margin: 0, fontSize: "17px" }}>
                          {test.title}
                        </h3>

                        <p
                          style={{
                            ...styles.muted,
                            margin: 0,
                          }}
                        >
                          {test.description || "Practice mock test."}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                            color: "#64748b",
                            fontSize: "13px",
                          }}
                        >
                          <span>📝 {test.questionCount} Questions</span>
                          <span>⏱ {test.duration} Minutes</span>
                        </div>

                        {test.questionCount === 0 ? (
                          <p
                            style={{
                              color: "#b91c1c",
                              fontWeight: 700,
                              fontSize: "13px",
                            }}
                          >
                            No Questions Available
                          </p>
                        ) : available ? (
                          <a
                            href={`/exam?testId=${test.id}`}
                            style={{ ...styles.button, textAlign: "center" }}
                          >
                            Start Test →
                          </a>
                        ) : soon ? (
                          <div
                            style={{
                              background: "#fffbeb",
                              borderRadius: "9px",
                              padding: "11px",
                              color: "#92400e",
                              fontSize: "13px",
                            }}
                          >
                            <strong>Releases on:</strong>
                            <p style={{ margin: "5px 0" }}>
                              {new Date(test.availableFrom!).toLocaleString(
                                "en-IN"
                              )}
                            </p>
                            <strong>Releases in:</strong>
                            <p style={{ margin: "5px 0 0", fontWeight: 800 }}>
                              {getCountdown(test.availableFrom!)}
                            </p>
                          </div>
                        ) : (
                          <Status available={false} />
                        )}
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "16px",
                      padding: "24px 0 5px",
                    }}
                  >
                    <button
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={safePage === 1}
                      style={{
                        ...styles.button,
                        opacity: safePage === 1 ? 0.5 : 1,
                      }}
                    >
                      Previous
                    </button>

                    <span style={{ color: "#475569", fontSize: "14px" }}>
                      Page {safePage} of {totalPages}
                    </span>

                    <button
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalPages, page + 1)
                        )
                      }
                      disabled={safePage === totalPages}
                      style={{
                        ...styles.button,
                        opacity: safePage === totalPages ? 0.5 : 1,
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
        </section>

        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "12px",
            marginTop: "22px",
          }}
        >
          State SSC & PCS Mock Exam Platform
        </p>
      </div>
    </main>
  );
}
