
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

export default function ManageTestsPage() {
  const router = useRouter();

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
const [savingSchedule, setSavingSchedule] = useState(false);

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
          return;
        }

        setTests(data.tests || []);
      } catch {
        setMessage("Unable to connect to server.");
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
      setMessage(data.error || "Unable to update schedule.");
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
  } catch {
    setMessage("Unable to connect to server.");
  } finally {
    setSavingSchedule(false);
  }
}
  const filteredTests = tests.filter((test) => {
  const searchText = search.toLowerCase();

  return (
    test.title.toLowerCase().includes(searchText) ||
    (test.description || "").toLowerCase().includes(searchText)
  );
});
const totalPages = Math.ceil(filteredTests.length / testsPerPage);

const startIndex = (currentPage - 1) * testsPerPage;

const paginatedTests = filteredTests.slice(
  startIndex,
  startIndex + testsPerPage
);

  if (loading) {
    return <main style={styles.container}>Checking admin access...</main>;
  }

  return (
    <main style={styles.container}>
      <h1>Manage Mock Tests</h1>

      <p>View all mock tests available on your website.</p>

      <div style={styles.card}>
        <h2>Total Mock Tests</h2>
        <p style={styles.number}>{tests.length}</p>
      </div>

      <h2>Available Tests</h2>
      <input
  type="text"
  placeholder="Search mock tests by title or description..."
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

{message ? (
  <p style={styles.error}>{message}</p>
) : tests.length === 0 ? (
  <p>No mock tests found. Create your first test.</p>
) : filteredTests.length === 0 ? (
  <p>No matching mock tests found.</p>
) : (
<div style={styles.list}>
    {paginatedTests.map((test) => (
            <div key={test.id} style={styles.testCard}>
              <h3>{test.title}</h3>
              <p>{test.description || "No description available."}</p>
              <p>Test ID: {test.id}</p>
              <p>Duration: {test.duration} minutes</p>
              <p>
  Status:{" "}
  {test.isPublished
    ? "Published"
    : test.availableFrom
      ? new Date(test.availableFrom) <= new Date()
        ? "Released (Scheduled)"
        : "Scheduled"
      : "Unpublished"}
</p>

{test.availableFrom && (
  <p>
    Release Date:{" "}
    {new Date(test.availableFrom).toLocaleString("en-IN")}
  </p>
)}
              <p>Questions: {test._count?.questions ?? 0}</p>
              <button
  onClick={() => {
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
  }}
  style={{
    padding: "10px 18px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "10px",
  }}
>
  Manage Availability
</button>

{selectedTestId === test.id && (
  <div
    style={{
      marginTop: "15px",
      padding: "15px",
      background: "#f1f5f9",
      borderRadius: "8px",
    }}
  >
    <h4>Change Test Availability</h4>

    <label>Release Date and Time</label>
    <input
      type="datetime-local"
      value={releaseDate}
      onChange={(e) => setReleaseDate(e.target.value)}
      style={{
        display: "block",
        padding: "10px",
        margin: "10px 0",
        width: "100%",
      }}
    />

    <button
      disabled={!releaseDate || savingSchedule}
      onClick={() =>
        updateSchedule(
          test,
          false,
          new Date(releaseDate).toISOString()
        )
      }
    >
      Save Schedule
    </button>

    <button
      disabled={savingSchedule}
      onClick={() => updateSchedule(test, true, null)}
      style={{ marginLeft: "8px" }}
    >
      Publish Now
    </button>

    <button
      disabled={savingSchedule}
      onClick={() => updateSchedule(test, false, null)}
      style={{ marginLeft: "8px" }}
    >
      Cancel / Unpublish
    </button>

    <button
      onClick={() => setSelectedTestId(null)}
      style={{ marginLeft: "8px" }}
    >
      Close
    </button>
  </div>
)}
              <button
  onClick={() => {
    router.push(`/admin/edit-test/${test.id}`);
  }}
  style={{
    padding: "10px 18px",
    background: "#174ea6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  }}
>
  Edit Test
</button>

<button
  onClick={async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${test.title}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/admin/tests/${test.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/admin-login");
        return;
      }

      if (!response.ok) {
        alert(data.message || "Unable to delete test.");
        return;
      }

      setTests((previousTests) =>
        previousTests.filter((item) => item.id !== test.id)
      );

      alert("Mock test deleted successfully!");
    } catch {
      alert("Unable to connect to server.");
    }
  }}
  style={{
    marginLeft: "10px",
    padding: "10px 18px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  }}
>
  Delete Test
</button>

            </div>
          ))}
        </div>
      )}
      {filteredTests.length > 0 && (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "15px",
      marginTop: "20px",
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

      <br />
      <a href="/admin/tests">+ Create New Test</a>
      <br /><br />
      <a href="/admin-dashboard">← Back to Dashboard</a>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1000px",
    margin: "40px auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  card: {
    background: "#f0f5ff",
    padding: "20px",
    borderRadius: "10px",
    margin: "25px 0",
  },
  number: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#174ea6",
  },
  list: {
    display: "grid",
    gap: "15px",
  },
  testCard: {
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    background: "#fff",
  },
  error: {
    color: "red",
  },
};
