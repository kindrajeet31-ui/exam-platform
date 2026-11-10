
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Test = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
};

export default function EditTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function loadTest() {
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
          setIsError(true);
          setMessage(data.message || "Unable to load test.");
          return;
        }

        const tests: Test[] = data.tests || [];
        const test = tests.find((item) => item.id === Number(testId));

        if (!test) {
          setIsError(true);
          setMessage("Mock test not found.");
          return;
        }

        setTitle(test.title);
        setDescription(test.description || "");
        setDuration(String(test.duration));
      } catch {
        setIsError(true);
        setMessage("Unable to connect to server.");
      } finally {
        setLoading(false);
      }
    }

    if (testId) loadTest();
  }, [testId, router]);

  async function updateTest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`/api/admin/tests/${testId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          duration: Number(duration),
        }),
      });

      const data = await response.json();

     if (response.status === 401 || response.status === 403) {
  router.replace("/admin-login");
  return;
}

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || "Unable to update test.");
        return;
      }

      setMessage("Mock test updated successfully!");

      setTimeout(() => {
        router.push("/admin/manage-tests");
      }, 1200);
    } catch {
      setIsError(true);
      setMessage("Unable to connect to server.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 15px",
    border: "1px solid #d5dce7",
    borderRadius: "9px",
    fontSize: "15px",
    color: "#172033",
    background: "#ffffff",
    boxSizing: "border-box",
    outline: "none",
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingCard}>Loading test details...</div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.topBar}>
          <div>
            <p style={styles.eyebrow}>ADMINISTRATION</p>
            <h1 style={styles.heading}>Edit Mock Test</h1>
            <p style={styles.subtitle}>
              Update the details of your examination.
            </p>
          </div>

          <button
            type="button"
            style={styles.topBackButton}
            onClick={() => router.push("/admin/manage-tests")}
          >
            ← Back
          </button>
        </div>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Test Information</h2>
            <p style={styles.cardSubtitle}>
              Make changes to the fields below.
            </p>
          </div>

          {message && (
            <div
              style={{
                ...styles.message,
                background: isError ? "#fff1f2" : "#ecfdf5",
                color: isError ? "#be123c" : "#047857",
                borderColor: isError ? "#fecdd3" : "#a7f3d0",
              }}
            >
              {message}
            </div>
          )}

          {!isError && (
            <form onSubmit={updateTest} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Test Title</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter test title"
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={{ ...inputStyle, resize: "vertical" }}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="Enter test description"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Duration</label>
                <div style={styles.durationWrapper}>
                  <input
                    style={inputStyle}
                    type="number"
                    min="1"
                    max="300"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    required
                  />
                  <span style={styles.minutes}>Minutes</span>
                </div>
                <p style={styles.helpText}>
                  Set the examination duration between 1 and 300 minutes.
                </p>
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => router.push("/admin/manage-tests")}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...styles.saveButton,
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </section>

        <p style={styles.footer}>
          State SSC & PCS Mock Exam · Admin Panel
        </p>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    padding: "45px 20px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },
  wrapper: {
    maxWidth: "850px",
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#2563eb",
    letterSpacing: "1.5px",
    margin: "0 0 8px",
  },
  heading: {
    fontSize: "30px",
    fontWeight: "bold",
    color: "#172033",
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: "15px",
    color: "#64748b",
    margin: 0,
  },
  topBackButton: {
    padding: "11px 18px",
    background: "#ffffff",
    border: "1px solid #dbe2ea",
    borderRadius: "8px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "30px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.05)",
  },
  cardHeader: {
    borderBottom: "1px solid #edf0f4",
    paddingBottom: "20px",
    marginBottom: "25px",
  },
  cardTitle: {
    fontSize: "20px",
    color: "#172033",
    margin: "0 0 7px",
  },
  cardSubtitle: {
    color: "#64748b",
    fontSize: "14px",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#334155",
  },
  durationWrapper: {
    maxWidth: "260px",
    position: "relative",
  },
  minutes: {
    position: "absolute",
    right: "14px",
    top: "14px",
    fontSize: "13px",
    color: "#64748b",
    pointerEvents: "none",
  },
  helpText: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: 0,
  },
  message: {
    padding: "13px 15px",
    border: "1px solid",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "22px",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    paddingTop: "20px",
    borderTop: "1px solid #edf0f4",
    flexWrap: "wrap",
  },
  cancelButton: {
    padding: "13px 22px",
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  saveButton: {
    padding: "13px 24px",
    background: "#1d4ed8",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
  },
  loadingCard: {
    maxWidth: "850px",
    margin: "80px auto",
    padding: "35px",
    textAlign: "center",
    background: "#ffffff",
    borderRadius: "12px",
    color: "#475569",
  },
  footer: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "25px",
  },
};
