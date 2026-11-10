
"use client";

import { useEffect, useState } from "react";

type Test = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  createdAt: string;
  availableFrom: string | null;
  isPublished: boolean;
  _count: {
    questions: number;
    results: number;
  };
};

export default function AdminSchedulePage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    async function fetchTests() {
      try {
        const response = await fetch("/api/admin/manage-tests", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          window.location.href = "/admin-login";
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Could not load tests.");
        }

        setTests(data.tests || []);
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

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function getTestsForDay(day: number) {
    return tests.filter((test) => {
      if (!test.availableFrom) return false;

      const date = new Date(test.availableFrom);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      );
    });
  }

  function getStatus(test: Test) {
    if (test.isPublished) return "Published";

    if (test.availableFrom) {
      return new Date(test.availableFrom).getTime() <= Date.now()
        ? "Released"
        : "Scheduled";
    }

    return "Unpublished";
  }

  function getStatusColor(test: Test) {
    const status = getStatus(test);

    if (status === "Published") return "#15803d";
    if (status === "Released") return "#2563eb";
    if (status === "Scheduled") return "#d97706";

    return "#64748b";
  }

const scheduledTests = tests
  .filter(
    (test) =>
      !test.isPublished &&
      test.availableFrom &&
      new Date(test.availableFrom).getTime() > Date.now()
  )
  .sort(
    (a, b) =>
      new Date(a.availableFrom!).getTime() -
      new Date(b.availableFrom!).getTime()
  );

const otherTests = tests.filter(
  (test) =>
    test.isPublished ||
    !test.availableFrom ||
    new Date(test.availableFrom).getTime() <= Date.now()
);

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Exam Schedule Calendar</h1>
            <p className="dashboard-subtitle">
              View and manage your mock test release schedule.
            </p>
          </div>

<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
  <a href="/admin/manage-tests" className="dashboard-button">
    Manage Tests
  </a>

  <a href="/admin-dashboard" className="dashboard-button">
    Dashboard
  </a>
</div>
        </header>

        {loading && <p>Loading calendar...</p>}

        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && (
          <section className="results-panel">
            <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
    marginBottom: "25px",
  }}
>
  <div className="results-panel">
    <h3>Total Tests</h3>
    <h2>{tests.length}</h2>
  </div>

  <div className="results-panel">
    <h3>Scheduled Tests</h3>
    <h2>{scheduledTests.length}</h2>
  </div>

  <div className="results-panel">
    <h3>Published Tests</h3>
    <h2>{tests.filter((test) => test.isPublished).length}</h2>
  </div>
  <div className="results-panel">
  <h3>Released Tests</h3>
  <h2>
    {
      tests.filter(
        (test) =>
          !test.isPublished &&
          test.availableFrom &&
          new Date(test.availableFrom).getTime() <= Date.now()
      ).length
    }
  </h2>
</div>
</div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <button
                onClick={() =>
                  setCurrentMonth(new Date(year, month - 1, 1))
                }
              >
                Previous
              </button>
              <button onClick={() => setCurrentMonth(new Date())}>
  Today
</button>

              <h2>
                {currentMonth.toLocaleString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>

              <button
                onClick={() =>
                  setCurrentMonth(new Date(year, month + 1, 1))
                }
              >
                Next
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: "5px",
              }}
            >
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div
                    key={day}
                    style={{
                      padding: "10px 2px",
                      textAlign: "center",
                      fontWeight: "bold",
                      background: "#e2e8f0",
                      borderRadius: "5px",
                    }}
                  >
                    {day}
                  </div>
                )
              )}

              {calendarDays.map((day, index) => {
                const dayTests = day ? getTestsForDay(day) : [];

                return (
                  <div
                    key={index}
                    style={{
                      minHeight: "110px",
                      padding: "6px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                    background:
  day === new Date().getDate() &&
  year === new Date().getFullYear() &&
  month === new Date().getMonth()
    ? "#dbeafe"
    : day
      ? "#ffffff"
      : "#f8fafc",
                      overflow: "hidden",
                    }}
                  >
                    {day && (
                      <>
                        <strong>{day}</strong>

                        {dayTests.map((test) => (
                          <div
                            key={test.id}
                            style={{
                              marginTop: "6px",
                              padding: "5px",
                              background: "#fff7ed",
                              borderRadius: "4px",
                              fontSize: "11px",
                              overflowWrap: "anywhere",
                            }}
                          >
                            <strong>{test.title}</strong>

                            <p style={{ color: getStatusColor(test) }}>
                              {getStatus(test)}
                            </p>

                            <p>
                              {new Date(
                                test.availableFrom!
                              ).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "25px" }}>
              <h2>Scheduled Tests</h2>
              <div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    marginTop: "20px",
    marginBottom: "20px",
  }}
>
  {[
    { label: "Published", color: "#15803d" },
    { label: "Released", color: "#2563eb" },
    { label: "Scheduled", color: "#d97706" },
    { label: "Unpublished", color: "#64748b" },
  ].map((item) => (
    <span
      key={item.label}
      style={{ color: item.color, fontWeight: "bold" }}
    >
      ● {item.label}
    </span>
  ))}
</div>

              {scheduledTests.length === 0 ? (
                <p>No scheduled tests found.</p>
              ) : (
                scheduledTests.map((test) => (
                  <div
                    key={test.id}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
<a
  href="/admin/manage-tests"
  style={{
    fontWeight: "bold",
    color: "#1d4ed8",
    textDecoration: "underline",
  }}
>
  {test.title}
</a>

                    <p>
                      Release:{" "}
                      {new Date(test.availableFrom!).toLocaleString("en-IN")}
                    </p>

                    <p>
                      Status:{" "}
                      <span style={{ color: getStatusColor(test) }}>
                        {getStatus(test)}
                      </span>
                    </p>

<a
  href="/admin/manage-tests"
  className="dashboard-button"
  style={{ display: "inline-block", marginTop: "10px" }}
>
  Manage Availability
</a>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: "25px" }}>
              <h2>Other Tests</h2>

              {otherTests.length === 0 ? (
                <p>No other tests found.</p>
              ) : (
                otherTests.map((test) => (
                  <p key={test.id} style={{ margin: "10px 0" }}>
                    {test.title} — {getStatus(test)}
                  </p>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
