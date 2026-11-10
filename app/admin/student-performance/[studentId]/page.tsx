import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../../../lib/prisma";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function StudentPerformancePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    redirect("/admin-login");
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  if (!sessionToken) {
    redirect("/admin-login");
  }

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

  try {
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
      select: { id: true },
    });

    if (!admin) {
      redirect("/admin-login");
    }
  } catch {
    redirect("/admin-login");
  }

  const { studentId } = await params;
  const id = Number(studentId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      examResults: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          score: true,
          totalQuestions: true,
          createdAt: true,
          test: {
            select: {
              title: true,
              setNumber: true,
              exam: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const results = student.examResults;

  const totalAttempts = results.length;

  const averagePercentage =
    totalAttempts > 0
      ? Math.round(
          results.reduce(
            (sum, result) =>
              sum +
              (result.totalQuestions > 0
                ? (result.score / result.totalQuestions) * 100
                : 0),
            0
          ) / totalAttempts
        )
      : 0;

  const highestPercentage =
    totalAttempts > 0
      ? Math.round(
          Math.max(
            ...results.map((result) =>
              result.totalQuestions > 0
                ? (result.score / result.totalQuestions) * 100
                : 0
            )
          )
        )
      : 0;

  const categoryMap = new Map<
    string,
    { attempts: number; totalScore: number; totalQuestions: number }
  >();

  for (const result of results) {
    const category = result.test.exam?.name || "Other Tests";

    const current = categoryMap.get(category) || {
      attempts: 0,
      totalScore: 0,
      totalQuestions: 0,
    };

    current.attempts += 1;
    current.totalScore += result.score;
    current.totalQuestions += result.totalQuestions;

    categoryMap.set(category, current);
  }

  const categoryStats = Array.from(categoryMap.entries())
    .map(([name, stats]) => ({
      name,
      ...stats,
      average:
        stats.totalQuestions > 0
          ? Math.round(
              (stats.totalScore / stats.totalQuestions) * 100
            )
          : 0,
    }))
    .sort((a, b) => b.average - a.average);

  const strongestCategory = categoryStats[0];
  const weakestCategory = categoryStats[categoryStats.length - 1];

  return (
    <main style={styles.container}>
      <a href="/admin/students">← Back to Manage Students</a>

      <h1>Student Performance History</h1>
      <PrintButton />

      <section style={styles.card}>
        <h2>{student.name}</h2>
        <p>Email: {student.email}</p>
        <p>
          Registration Date:{" "}
          {new Date(student.createdAt).toLocaleDateString("en-IN")}
        </p>
      </section>

      <h2>Overall Performance</h2>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Total Attempts</h3>
          <p style={styles.number}>{totalAttempts}</p>
        </div>

        <div style={styles.card}>
          <h3>Average Percentage</h3>
          <p style={styles.number}>{averagePercentage}%</p>
        </div>

        <div style={styles.card}>
          <h3>Highest Percentage</h3>
          <p style={styles.number}>{highestPercentage}%</p>
        </div>
      </div>

      <h2>Category Performance</h2>

      {categoryStats.length === 0 ? (
        <p>This student has not attempted any exams yet.</p>
      ) : (
        <>
          <p>
            <strong>Strongest Category:</strong>{" "}
            {strongestCategory.name} ({strongestCategory.average}%)
          </p>

          <p>
            <strong>Weakest Category:</strong>{" "}
            {weakestCategory.name} ({weakestCategory.average}%)
          </p>

          <div style={styles.grid}>
            {categoryStats.map((category) => (
              <div key={category.name} style={styles.card}>
                <h3>{category.name}</h3>
                <p>Attempts: {category.attempts}</p>
                <p>Average: {category.average}%</p>
              </div>
            ))}
          </div>
        </>
      )}
      <h2>Performance Improvement Over Time</h2>

{results.length === 0 ? (
  <p>No performance history available.</p>
) : (
  <div style={styles.card}>
    {results
      .slice()
      .reverse()
      .map((result, index) => {
        const percentage =
          result.totalQuestions > 0
            ? Math.round(
                (result.score / result.totalQuestions) * 100
              )
            : 0;

        return (
          <div key={result.id} style={{ marginBottom: "18px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <strong>Attempt {index + 1}</strong>
              <strong>{percentage}%</strong>
            </div>

            <div
              style={{
                height: "16px",
                background: "#e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percentage}%`,
                  height: "100%",
                  background: "#2563eb",
                }}
              />
            </div>

            <small>
              {new Date(result.createdAt).toLocaleDateString("en-IN")}
            </small>
          </div>
        );
      })}
  </div>
)}

      <h2>Exam History</h2>

      {results.length === 0 ? (
        <p>No exam attempts found.</p>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cell}>Exam Category</th>
                <th style={styles.cell}>Test / Set</th>
                <th style={styles.cell}>Score</th>
                <th style={styles.cell}>Percentage</th>
                <th style={styles.cell}>Date</th>
              </tr>
            </thead>

            <tbody>
              {results.map((result) => {
                const percentage =
                  result.totalQuestions > 0
                    ? Math.round(
                        (result.score / result.totalQuestions) * 100
                      )
                    : 0;

                return (
                  <tr key={result.id}>
                    <td style={styles.cell}>
                      {result.test.exam?.name || "Other Tests"}
                    </td>

                    <td style={styles.cell}>
                      {result.test.setNumber
                        ? `Set ${result.test.setNumber}`
                        : result.test.title}
                    </td>

                    <td style={styles.cell}>
                      {result.score}/{result.totalQuestions}
                    </td>

                    <td style={styles.cell}>{percentage}%</td>

                    <td style={styles.cell}>
                      {new Date(result.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1100px",
    margin: "40px auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  card: {
    background: "#f0f5ff",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #d5e2f5",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    margin: "20px 0",
  },
  number: {
    fontSize: "30px",
    fontWeight: "bold",
    color: "#174ea6",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
  },
  cell: {
    border: "1px solid #ddd",
    padding: "12px",
    textAlign: "left",
  },
};