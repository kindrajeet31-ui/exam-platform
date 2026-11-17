
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Test = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  availableFrom: string | null;
  isPublished: boolean;
  _count?: {
    questions: number;
  };
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 15px",
  border: "none",
  borderRadius: "8px",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "13px",
};

export default function ManageTestsPage() {
  const router = useRouter();

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [releaseDate, setReleaseDate] = useState("");
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [deletingTestId, setDeletingTestId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const testsPerPage = 10;

  useEffect(() => {
    async function loadTests() {
      try {
        const response = await fetch("/api/admin/manage-tests", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          router.replace("/admin-login");
          return;
        }

        if (!response.ok) {
          setMessage(data.message || "Unable to load tests.");
          setMessageType("error");
          return;
        }

        setTests(data.tests || []);
      } catch {
        setMessage("Unable to connect to server.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }

    loadTests();
  }, [router]);

  async function updateSchedule(
    test: Test,
    isPublished: boolean,
    availableFrom: string | null
  ) {
    setSavingSchedule(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/tests/${test.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: test.title,
          description: test.description,
          duration: test.duration,
          isPublished,
          availableFrom,
        }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        router.replace("/admin-login");
        return;
      }

      if (!response.ok) {
        setMessage(data.error || "Unable to update availability.");
        setMessageType("error");
        return;
      }

      setTests((previousTests) =>
        previousTests.map((item) =>
          item.id === test.id
            ? {
                ...item,
                isPublished: data.test.isPublished,
                availableFrom: data.test.availableFrom,
              }
            : item
        )
      );

      setSelectedTestId(null);
      setReleaseDate("");
      setMessage("Test availability updated successfully.");
      setMessageType("success");
    } catch {
      setMessage("Unable to connect to server.");
      setMessageType("error");
    } finally {
      setSavingSchedule(false);
    }
  }

  async function deleteTest(test: Test) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${test.title}"?`
    );

    if (!confirmed) return;

    setDeletingTestId(test.id);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/tests/${test.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        router.replace("/admin-login");
        return;
      }

      if (!response.ok) {
        setMessage(data.message || data.error || "Unable to delete test.");
        setMessageType("error");
        return;
      }

      setTests((previousTests) =>
        previousTests.filter((item) => item.id !== test.id)
      );

      if (selectedTestId === test.id) {
        setSelectedTestId(null);
      }

      setMessage("Mock test deleted successfully.");
      setMessageType("success");
    } catch {
      setMessage("Unable to connect to server.");
      setMessageType("error");
    } finally {
      setDeletingTestId(null);
    }
  }

  const filteredTests = tests.filter((test) => {
    const searchText = search.trim().toLowerCase();

    return (
      test.title.toLowerCase().includes(searchText) ||
      (test.description || "").toLowerCase().includes(searchText)
    );
  });

  const totalPages = Math.ceil(filteredTests.length / testsPerPage);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIndex = (safePage - 1) * testsPerPage;

  const paginatedTests = filteredTests.slice(
    startIndex,
    startIndex + testsPerPage
  );

  const publishedCount = tests.filter((test) => test.isPublished).length;
  const scheduledCount = tests.filter(
    (test) => !test.isPublished && !!test.availableFrom
  ).length;
  const totalQuestions = tests.reduce(
    (total, test) => total + (test._count?.questions ?? 0),
    0
  );

  function getStatus(test: Test) {
    if (test.isPublished) {
      return {
        label: "Published",
        color: "#15803d",
        background: "#dcfce7",
      };
    }

    if (test.availableFrom) {
      const released =
        new Date(test.availableFrom).getTime() <= Date.now();

      if (released) {
        return {
          label: "Scheduled · Released",
          color: "#0369a1",
          background: "#e0f2fe",
        };
      }

      return {
        label: "Scheduled",
        color: "#b45309",
        background: "#fef3c7",
      };
    }

    return {
      label: "Unpublished",
      color: "#b91c1c",
      background: "#fee2e2",
    };
  }

  function openSchedule(test: Test) {
    setSelectedTestId(test.id);

    setReleaseDate(
      test.availableFrom
        ? new Date(
            new Date(test.availableFrom).getTime() -
              new Date().getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 16)
        : ""
    );
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f1f5f9",
          display: "grid",
          placeItems: "center",
          color: "#1e3a8a",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>Checking admin access...</h2>
          <p style={{ color: "#64748b" }}>Loading your mock tests.</p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "30px 16px",
        color: "#0f172a",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
        <header
          style={{
            background: "linear-gradient(120deg, #0f2d59, #1d4ed8)",
            color: "white",
            borderRadius: "18px",
            padding: "28px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "18px",
          }}
        >
          <div>
            <p
              style={{
                color: "#bfdbfe",
                fontWeight: 800,
                fontSize: "12px",
                letterSpacing: "1.5px",
                margin: "0 0 8px",
              }}
            >
              ADMINISTRATION
            </p>
            <h1 style={{ fontSize: "30px", margin: 0 }}>
              Manage Mock Tests
            </h1>
            <p style={{ color: "#dbeafe", margin: "9px 0 0" }}>
              Create, manage, schedule and publish examination sets.
            </p>
          </div>

          <a
            href="/admin-dashboard"
            style={{
              ...buttonStyle,
              background: "white",
              color: "#1d4ed8",
              textDecoration: "none",
            }}
          >
            ← Dashboard
          </a>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Total Mock Tests",
              value: tests.length,
              color: "#1d4ed8",
            },
            {
              label: "Published Tests",
              value: publishedCount,
              color: "#15803d",
            },
            {
              label: "Scheduled Tests",
              value: scheduledCount,
              color: "#b45309",
            },
            {
              label: "Total Questions",
              value: totalQuestions,
              color: "#7c3aed",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "20px",
                boxShadow: "0 4px 15px rgba(15,23,42,0.04)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {item.label}
              </p>
              <h2
                style={{
                  fontSize: "30px",
                  color: item.color,
                  margin: "8px 0 0",
                }}
              >
                {item.value}
              </h2>
            </div>
          ))}
        </section>

        {message && (
          <div
            role="status"
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              marginBottom: "18px",
              background:
                messageType === "success" ? "#dcfce7" : "#fee2e2",
              color: messageType === "success" ? "#166534" : "#991b1b",
              border:
                messageType === "success"
                  ? "1px solid #86efac"
                  : "1px solid #fecaca",
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        <section
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "22px",
            boxShadow: "0 4px 15px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "21px" }}>
                All Mock Tests
              </h2>
              <p style={{ color: "#64748b", fontSize: "13px" }}>
                Search and manage your examination sets.
              </p>
            </div>

            <a
              href="/admin/tests"
              style={{
                ...buttonStyle,
                background: "#15803d",
                textDecoration: "none",
              }}
            >
              + Create New Test
            </a>
          </div>

          <input
            type="search"
            placeholder="Search by test title or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 16px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              fontSize: "15px",
              marginBottom: "20px",
            }}
          />

          {tests.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "35px 15px",
                background: "#f8fafc",
                borderRadius: "12px",
              }}
            >
              <h3>No mock tests found.</h3>
              <p style={{ color: "#64748b" }}>
                Create your first test to get started.
              </p>
            </div>
          ) : filteredTests.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "30px",
                background: "#f8fafc",
                borderRadius: "12px",
                color: "#64748b",
              }}
            >
              No matching mock tests found. Try another search.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {paginatedTests.map((test) => {
                const status = getStatus(test);
                const isSelected = selectedTestId === test.id;

                return (
                  <article
                    key={test.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "20px",
                      background: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div style={{ flex: "1 1 250px" }}>
                        <p
                          style={{
                            color: "#64748b",
                            fontSize: "12px",
                            fontWeight: 700,
                            margin: "0 0 7px",
                          }}
                        >
                          TEST ID: {test.id}
                        </p>
                        <h3
                          style={{
                            fontSize: "19px",
                            margin: "0 0 8px",
                            color: "#0f172a",
                          }}
                        >
                          {test.title}
                        </h3>
                        <p
                          style={{
                            color: "#64748b",
                            fontSize: "14px",
                            margin: 0,
                          }}
                        >
                          {test.description || "No description available."}
                        </p>
                      </div>

                      <span
                        style={{
                          padding: "7px 12px",
                          borderRadius: "30px",
                          background: status.background,
                          color: status.color,
                          fontSize: "12px",
                          fontWeight: 800,
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "18px",
                        margin: "18px 0",
                        padding: "13px",
                        background: "#f8fafc",
                        borderRadius: "9px",
                        color: "#475569",
                        fontSize: "13px",
                      }}
                    >
                      <span>
                        <strong>Duration:</strong> {test.duration} minutes
                      </span>
                      <span>
                        <strong>Questions:</strong>{" "}
                        {test._count?.questions ?? 0}
                      </span>
                      {test.availableFrom && (
                        <span>
                          <strong>Release:</strong>{" "}
                          {new Date(test.availableFrom).toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "9px",
                      }}
                    >
                      <button
                        onClick={() => openSchedule(test)}
                        style={{
                          ...buttonStyle,
                          background: "#7c3aed",
                        }}
                      >
                        Manage Availability
                      </button>

                      <button
                        onClick={() =>
                          router.push(`/admin/edit-test/${test.id}`)
                        }
                        style={{
                          ...buttonStyle,
                          background: "#1d4ed8",
                        }}
                      >
                        Edit Test
                      </button>

                      <button
                        onClick={() => deleteTest(test)}
                        disabled={deletingTestId === test.id}
                        style={{
                          ...buttonStyle,
                          background: "#dc2626",
                          opacity: deletingTestId === test.id ? 0.6 : 1,
                        }}
                      >
                        {deletingTestId === test.id
                          ? "Deleting..."
                          : "Delete Test"}
                      </button>
                    </div>

                    {isSelected && (
                      <div
                        style={{
                          marginTop: "18px",
                          padding: "18px",
                          border: "1px solid #c7d2fe",
                          background: "#f8faff",
                          borderRadius: "12px",
                        }}
                      >
                        <h4 style={{ margin: "0 0 8px", fontSize: "17px" }}>
                          Change Test Availability
                        </h4>

                        <p
                          style={{
                            color: "#64748b",
                            fontSize: "13px",
                            margin: "0 0 14px",
                          }}
                        >
                          Select a release date or publish the test
                          immediately.
                        </p>

                        <label
                          htmlFor={`release-${test.id}`}
                          style={{
                            display: "block",
                            fontSize: "13px",
                            fontWeight: 700,
                            marginBottom: "7px",
                          }}
                        >
                          Release Date and Time
                        </label>

                        <input
                          id={`release-${test.id}`}
                          type="datetime-local"
                          value={releaseDate}
                          onChange={(e) => setReleaseDate(e.target.value)}
                          style={{
                            display: "block",
                            width: "100%",
                            maxWidth: "380px",
                            boxSizing: "border-box",
                            padding: "12px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            marginBottom: "15px",
                            fontSize: "14px",
                          }}
                        />

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "9px",
                          }}
                        >
                          <button
                            disabled={!releaseDate || savingSchedule}
                            onClick={() => {
                              const date = new Date(releaseDate);

                              if (Number.isNaN(date.getTime())) {
                                setMessage("Please select a valid date.");
                                setMessageType("error");
                                return;
                              }

                              updateSchedule(
                                test,
                                false,
                                date.toISOString()
                              );
                            }}
                            style={{
                              ...buttonStyle,
                              background: "#d97706",
                              opacity:
                                !releaseDate || savingSchedule ? 0.5 : 1,
                            }}
                          >
                            Save Schedule
                          </button>

                          <button
                            disabled={savingSchedule}
                            onClick={() =>
                              updateSchedule(test, true, null)
                            }
                            style={{
                              ...buttonStyle,
                              background: "#15803d",
                            }}
                          >
                            Publish Now
                          </button>

                          <button
                            disabled={savingSchedule}
                            onClick={() =>
                              updateSchedule(test, false, null)
                            }
                            style={{
                              ...buttonStyle,
                              background: "#dc2626",
                            }}
                          >
                            Cancel / Unpublish
                          </button>

                          <button
                            disabled={savingSchedule}
                            onClick={() => {
                              setSelectedTestId(null);
                              setReleaseDate("");
                            }}
                            style={{
                              ...buttonStyle,
                              background: "#64748b",
                            }}
                          >
                            Close
                          </button>
                        </div>

                        {savingSchedule && (
                          <p
                            style={{
                              color: "#475569",
                              fontSize: "13px",
                              marginBottom: 0,
                            }}
                          >
                            Saving availability...
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {filteredTests.length > 0 && totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "15px",
                marginTop: "25px",
              }}
            >
              <button
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={safePage === 1}
                style={{
                  ...buttonStyle,
                  background: "#1d4ed8",
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
                  ...buttonStyle,
                  background: "#1d4ed8",
                  opacity: safePage === totalPages ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          )}
        </section>

        <footer
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "20px",
            padding: "24px 10px",
            fontSize: "14px",
          }}
        >
          <a
            href="/admin/tests"
            style={{ color: "#1d4ed8", fontWeight: 700 }}
          >
            + Create New Test
          </a>

          <a
            href="/admin-dashboard"
            style={{ color: "#1d4ed8", fontWeight: 700 }}
          >
            ← Back to Dashboard
          </a>
        </footer>
      </div>
    </main>
  );
}
