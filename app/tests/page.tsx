
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
  availableFrom: string | null;
  isPublished: boolean;
  isAvailable: boolean;
};

type Exam = {
  id: number;
  name: string;
  description: string | null;
  sets: ExamSet[];
};

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(Date.now());
  }, 1000);

  return () => clearInterval(timer);
}, []);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedExam, setSelectedExam] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const testsPerPage = 10;
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

  const groupedTestIds = new Set(
    exams.flatMap((exam) => exam.sets.map((set) => set.id))
  );

  const oldTests = tests.filter((test) => !groupedTestIds.has(test.id));

const filteredExams = exams.filter((exam) => {
  const searchText = search.toLowerCase();

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
    test.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTests.length / testsPerPage);
  const startIndex = (currentPage - 1) * testsPerPage;

  const paginatedTests = filteredTests.slice(
    startIndex,
    startIndex + testsPerPage
  );

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Available Mock Tests</h1>
            <p className="dashboard-subtitle">
              Practice for State SSC and PCS examinations.
            </p>
          </div>

          <a href="/" className="dashboard-button">
            Home
          </a>
        </header>

        <section className="results-panel">
          <input
            type="text"
            placeholder="Search exams or mock tests..."
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
              borderRadius: "8px",
              fontSize: "16px",
            }}
          />
          {!loading && !error && exams.length > 0 && (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginBottom: "20px",
    }}
  >
    <button
      onClick={() => setSelectedExam("all")}
      style={{
        padding: "10px 18px",
        borderRadius: "8px",
        border: "1px solid #2563eb",
        background: selectedExam === "all" ? "#2563eb" : "white",
        color: selectedExam === "all" ? "white" : "#2563eb",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      All Exams
    </button>

    {exams.map((exam) => (
      <button
        key={exam.id}
        onClick={() => setSelectedExam(exam.id.toString())}
        style={{
          padding: "10px 18px",
          borderRadius: "8px",
          border: "1px solid #2563eb",
          background:
            selectedExam === exam.id.toString() ? "#2563eb" : "white",
          color:
            selectedExam === exam.id.toString() ? "white" : "#2563eb",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {exam.name}
      </button>
    ))}
  </div>
)}

          {loading && <p>Loading exams and tests...</p>}

          {error && <p style={{ color: "red" }}>{error}</p>}

          {!loading &&
         !error &&
          filteredExams.length === 0 &&
          (selectedExam !== "all" || filteredTests.length === 0) && (
         <p>No matching exams or tests found.</p>
          )}

     {!loading && !error && filteredExams.map((exam) => (
  <div
    key={exam.id}
    style={{
      padding: "20px",
      marginBottom: "20px",
      border: "1px solid #e5eaf2",
      borderRadius: "12px",
    }}
  >
    <h2 style={{ marginBottom: "8px" }}>{exam.name}</h2>

    <p style={{ color: "#64748b", marginBottom: "18px" }}>
      {exam.description || "Choose an exam set to start practicing."}
    </p>

    {exam.sets.length === 0 ? (
      <p>No sets available yet.</p>
    ) : (
      <div style={{ display: "grid", gap: "12px" }}>
        {exam.sets.map((set, index) => (
          <div
            key={set.id}
            style={{
              padding: "15px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h3>Set {set.setNumber ?? index + 1}</h3>
            <p>{set.title}</p>

            <p style={{ color: "#64748b", margin: "8px 0" }}>
              Questions: {set.questionCount} | Duration: {set.duration} minutes
            </p>

{set.questionCount === 0 ? (
  <p style={{ color: "red", fontWeight: "bold" }}>
    No Questions Available
  </p>
) : isSetAvailable(set) ? (
              <>
                <p style={{ color: "green", fontWeight: "bold" }}>
                  Available Now
                </p>
                <a
                  href={`/exam?testId=${set.id}`}
                  className="dashboard-button"
                >
                  Start Exam
                </a>
              </>
            ) : !set.isPublished && set.availableFrom ? (
              <div style={{ color: "#d97706", fontWeight: "bold" }}>
                <span
  style={{
    display: "inline-block",
    background: "#fef3c7",
    color: "#92400e",
    padding: "6px 12px",
    borderRadius: "6px",
    marginBottom: "8px",
  }}
>
  Available Soon
</span>
                <p>
                  Releases on:{" "}
                  {new Date(set.availableFrom).toLocaleString("en-IN")}
                </p>
                <p style={{ fontSize: "18px", marginTop: "8px" }}>
                  Releases in: {getCountdown(set.availableFrom)}
                </p>
              </div>
            ) : (
              <p style={{ color: "red", fontWeight: "bold" }}>
                Not Published
              </p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
))}

{!loading && !error && selectedExam === "all" && filteredTests.length > 0 && (
  <>
    <h2 style={{ marginBottom: "15px" }}>Other Mock Tests</h2>

    {paginatedTests.map((test) => (
      <div
        key={test.id}
        style={{
          padding: "20px 0",
          borderBottom: "1px solid #e5eaf2",
        }}
      >
        <h3>{test.title}</h3>
        <p>{test.description || "Practice mock test."}</p>

        <p style={{ color: "#64748b", marginTop: "8px" }}>
          Total Questions: {test.questionCount}
        </p>

        <p style={{ color: "#64748b", marginTop: "5px" }}>
          Duration: {test.duration} minutes
        </p>

        {isTestAvailable(test) ? (
          <>
            <p style={{ color: "green", fontWeight: "bold" }}>
              Available Now
            </p>
            <a
              href={`/exam?testId=${test.id}`}
              className="dashboard-button"
            >
              Start Test
            </a>
          </>
        ) : !test.isPublished && test.availableFrom ? (
          <div style={{ color: "#d97706", fontWeight: "bold" }}>
            <p>
              Releases on:{" "}
              {new Date(test.availableFrom).toLocaleString("en-IN")}
            </p>
            <p style={{ fontSize: "18px" }}>
              Releases in: {getCountdown(test.availableFrom)}
            </p>
            <button disabled>Available Soon</button>
          </div>
        ) : (
          <p style={{ color: "red", fontWeight: "bold" }}>
            Not Published
          </p>
        )}
      </div>
    ))}

    {totalPages > 1 && (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "15px",
          padding: "20px 0",
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
  </>
)}
        </section>
      </div>
    </main>
  );
}
