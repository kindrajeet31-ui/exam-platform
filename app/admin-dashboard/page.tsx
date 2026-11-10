
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    redirect("/admin-login");
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  if (!sessionToken) {
    redirect("/admin-login");
  }

  try {
    const [payload, signature] = sessionToken.split(".");

    if (!payload || !signature) {
      redirect("/admin-login");
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      redirect("/admin-login");
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      typeof session.adminId !== "number" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      redirect("/admin-login");
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!admin) {
      redirect("/admin-login");
    }

const [
  totalTests,
  totalStudents,
  totalResults,
  totalQuestions,
  examGroups,
  recentResults,
] = await Promise.all([
  prisma.test.count(),
  prisma.student.count(),
  prisma.examResult.count(),
  prisma.question.count(),

  prisma.exam.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      tests: {
        select: {
          id: true,
          title: true,
          setNumber: true,
results: {
  select: {
    score: true,
    totalQuestions: true,
    student: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    answers: {
      select: {
        isCorrect: true,
        selectedOption: true,
      },
    },
  },
},
        },
      },
    },
  }),

  prisma.examResult.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      score: true,
      totalQuestions: true,
      createdAt: true,
      student: {
        select: { name: true },
      },
      test: {
        select: { title: true },
      },
    },
  }),
]);
const examGroupStats = examGroups.map((exam) => {
  const allResults = exam.tests.flatMap((test) => test.results);

  const attempts = allResults.length;
  const studentMap = new Map<
  number,
  {
    name: string;
    email: string;
    attempts: number;
    totalScore: number;
    totalQuestions: number;
  }
>();

for (const result of allResults) {
  if (!result.student) continue;

  const studentId = result.student.id;

  const existing = studentMap.get(studentId) || {
    name: result.student.name,
    email: result.student.email,
    attempts: 0,
    totalScore: 0,
    totalQuestions: 0,
  };

  existing.attempts += 1;
  existing.totalScore += result.score;
  existing.totalQuestions += result.totalQuestions;

  studentMap.set(studentId, existing);
}

const topStudents = Array.from(studentMap.entries())
  .map(([id, student]) => ({
    id,
    ...student,
    averagePercentage:
      student.totalQuestions > 0
        ? Math.round(
            (student.totalScore / student.totalQuestions) * 100
          )
        : 0,
  }))
  .sort((a, b) => b.averagePercentage - a.averagePercentage)
  .slice(0, 5);
  const allAnswers = allResults.flatMap(
  (result) => result.answers
);

const correctAnswers = allAnswers.filter(
  (answer) => answer.isCorrect
).length;

const wrongAnswers = allAnswers.filter(
  (answer) =>
    !answer.isCorrect && answer.selectedOption !== -1
).length;

const unattemptedAnswers = allAnswers.filter(
  (answer) => answer.selectedOption === -1
).length;

  const percentages = allResults.map((result) =>
    result.totalQuestions > 0
      ? (result.score / result.totalQuestions) * 100
      : 0
  );

  const averagePercentage =
    attempts > 0
      ? percentages.reduce((sum, value) => sum + value, 0) / attempts
      : 0;

  const highestPercentage =
    attempts > 0 ? Math.max(...percentages) : 0;

  return {
    id: exam.id,
    name: exam.name,
    sets: exam.tests,
    attempts,
    averagePercentage: Math.round(averagePercentage),
    highestPercentage: Math.round(highestPercentage),
    correctAnswers,
    wrongAnswers,
    unattemptedAnswers,
    topStudents,
  };
});
    return (
      <main style={styles.container}>
        <h1 style={styles.heading}>Admin Dashboard</h1>

        <h2>Welcome, {admin.name}!</h2>
    <p>Email: {admin.email}</p>
        <form action="/api/admin/logout" method="POST">
  <button
    type="submit"
    style={{
      background: "#dc2626",
      color: "white",
      padding: "10px 22px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "bold",
      marginTop: "12px",
    }}
  >
    Admin Logout
  </button>
</form>

        <hr />

        <h2>Website Overview</h2>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>Total Mock Tests</h3>
            <p style={styles.number}>{totalTests}</p>
          </div>

          <div style={styles.card}>
            <h3>Total Students</h3>
            <p style={styles.number}>{totalStudents}</p>
          </div>

              <div style={styles.card}>
            <h3>Exam Attempts</h3>
            <p style={styles.number}>{totalResults}</p>
          </div>

          <div style={styles.card}>
            <h3>Total Questions</h3>
            <p style={styles.number}>{totalQuestions}</p>
          </div>
          <div style={styles.card}>
  <h3>Total Exam Categories</h3>
  <p style={styles.number}>{examGroups.length}</p>
</div>
        </div>
        <hr />
<h2>Group-wise Exam Result Analysis</h2>

{examGroupStats.length === 0 ? (
  <p>No exam categories available.</p>
) : (
  <div style={styles.recentList}>
    {examGroupStats.map((exam) => (
      <div key={exam.id} style={styles.recentCard}>
        <h3>{exam.name}</h3>

        <p>
          <strong>Total Sets:</strong> {exam.sets.length}
        </p>

        <p>
          <strong>Total Attempts:</strong> {exam.attempts}
        </p>

        <p>
          <strong>Average Percentage:</strong>{" "}
          {exam.averagePercentage}%
        </p>

        <p>
          <strong>Highest Percentage:</strong>{" "}
          {exam.highestPercentage}%
        </p>
        <p>
  <strong>Correct Answers:</strong>{" "}
  {exam.correctAnswers}
</p>

<p>
  <strong>Wrong Answers:</strong>{" "}
  {exam.wrongAnswers}
</p>

<p>
  <strong>Unattempted Answers:</strong>{" "}
  {exam.unattemptedAnswers}
</p>

        <hr />
<h4>Top 5 Students</h4>

{exam.topStudents.length === 0 ? (
  <p>No student results available.</p>
) : (
  exam.topStudents.map((student, index) => (
    <div
      key={student.id}
      style={{
        padding: "10px",
        marginBottom: "8px",
        background: "#f0f5ff",
        borderRadius: "6px",
      }}
    >
      <strong>
        {index + 1}. {student.name}
      </strong>

      <p>{student.email}</p>

      <p>
        Attempts: {student.attempts} | Average:{" "}
        {student.averagePercentage}%
      </p>
    </div>
  ))
)}
        <h4>Set-wise Performance</h4>

        {exam.sets.map((set) => {
          const setAttempts = set.results.length;

          const setAverage =
            setAttempts > 0
              ? set.results.reduce(
                  (sum, result) =>
                    sum +
                    (result.totalQuestions > 0
                      ? (result.score / result.totalQuestions) * 100
                      : 0),
                  0
                ) / setAttempts
              : 0;

          return (
            <div key={set.id} style={{ marginBottom: "12px" }}>
              <strong>
                {set.setNumber ? `Set ${set.setNumber}` : set.title}
              </strong>

              <p>
                Attempts: {setAttempts} | Average:{" "}
                {Math.round(setAverage)}%
              </p>
            </div>
          );
        })}
      </div>
    ))}
  </div>
)}

<hr />
<h2>Category Performance Comparison</h2>

{examGroupStats.length === 0 ? (
  <p>No category data available.</p>
) : (
  <div style={{ marginBottom: "30px" }}>
    {examGroupStats.map((exam) => (
      <div key={exam.id} style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <strong>{exam.name}</strong>
          <strong>{exam.averagePercentage}%</strong>
        </div>

        <div
          style={{
            width: "100%",
            height: "18px",
            background: "#e5e7eb",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${exam.averagePercentage}%`,
              height: "100%",
              background: "#2563eb",
              borderRadius: "10px",
            }}
          />
        </div>
      </div>
    ))}
  </div>
)}
        <h2>Manage Your Website</h2>
        <hr />

<h2>Recent Exam Attempts</h2>

{recentResults.length === 0 ? (
  <p>No exam attempts yet.</p>
) : (
  <div style={styles.recentList}>
    {recentResults.map((result) => (
      <div key={result.id} style={styles.recentCard}>
        <strong>{result.student?.name || "Unknown Student"}</strong>

        <p>Exam: {result.test.title}</p>

      <p>
  Score: {result.score} / {result.totalQuestions}
</p>

<p>
  Percentage:{" "}
  {result.totalQuestions > 0
    ? Math.round((result.score / result.totalQuestions) * 100)
    : 0}
  %
</p>

        <small>
          {new Date(result.createdAt).toLocaleString("en-IN")}
        </small>
      </div>
    ))}
  </div>
)}

    <div style={styles.menu}>
      <a href="/admin/schedule" style={styles.link}>
  Exam Schedule Calendar
</a>
  <a href="/admin/tests" style={styles.link}>
    + Create Mock Tests
  </a>

  <a href="/admin/manage-tests" style={styles.link}>
    Manage Existing Mock Tests
  </a>

  <a href="/admin/questions" style={styles.link}>
    + Add Questions
  </a>

  <a href="/admin/manage-questions" style={styles.link}>
    Manage Questions
  </a>

  <a href="/admin/students" style={styles.link}>
    Manage Students
  </a>

  <a href="/admin/results" style={styles.link}>
    View Exam Results
  </a>
  <a href="/admin/question-reports" style={styles.link}>
  Student Question Reports
</a>
  <a href="/leaderboard" style={styles.link}>
  View Student Leaderboard
</a>
</div>
      </main>
    );
  } catch {
    redirect("/admin-login");
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1100px",
    margin: "40px auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  heading: {
    color: "#174ea6",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginTop: "25px",
    marginBottom: "30px",
  },
  card: {
    padding: "24px",
    background: "#f0f5ff",
    borderRadius: "12px",
    border: "1px solid #d5e2f5",
  },
  number: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#174ea6",
  },
  menu: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
    marginTop: "20px",
  },
  link: {
    padding: "18px",
    background: "#174ea6",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: "bold",
  },
  recentList: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "15px",
  marginTop: "20px",
},

recentCard: {
  background: "#ffffff",
  padding: "18px",
  borderRadius: "10px",
  border: "1px solid #dddddd",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
},
};
