
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) redirect("/admin-login");

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  if (!sessionToken) redirect("/admin-login");

  try {
    const [payload, signature] = sessionToken.split(".");

    if (!payload || !signature) redirect("/admin-login");

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
      select: { id: true, name: true, email: true },
    });

    if (!admin) redirect("/admin-login");

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
          ? percentages.reduce((sum, value) => sum + value, 0) /
            attempts
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

    const navLinks = [
      { href: "/admin/tests", icon: "＋", label: "Create Mock Test" },
      { href: "/admin/manage-tests", icon: "▤", label: "Manage Tests" },
      { href: "/admin/questions", icon: "＋", label: "Add Questions" },
      { href: "/admin/manage-questions", icon: "☷", label: "Manage Questions" },
      { href: "/admin/students", icon: "♙", label: "Manage Students" },
      { href: "/admin/results", icon: "▥", label: "Exam Results" },
      { href: "/admin/schedule", icon: "▦", label: "Exam Schedule" },
      { href: "/admin/question-reports", icon: "⚑", label: "Question Reports" },
      { href: "/leaderboard", icon: "🏆", label: "Student Leaderboard" },
    ];

    return (
      <main className="dashboard">
        <style>{`
          * { box-sizing: border-box; }
          .dashboard {
            min-height: 100vh;
            background: #f3f6fc;
            color: #17243b;
            font-family: Arial, Helvetica, sans-serif;
            padding-bottom: 40px;
          }
          .topbar {
            background: #10264a;
            color: white;
            padding: 20px 4%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
          }
          .brand { font-size: 21px; font-weight: 800; }
          .brand small {
            display: block;
            color: #a9c1e7;
            font-size: 11px;
            margin-top: 5px;
            letter-spacing: 1px;
          }
          .admin-info { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
          .admin-info span { color: #d3def0; font-size: 13px; }
          .logout {
            background: #e34b55;
            color: white;
            border: 0;
            border-radius: 8px;
            padding: 11px 17px;
            font-weight: bold;
            cursor: pointer;
          }
          .nav {
            background: #19365f;
            padding: 12px 4%;
            display: flex;
            gap: 9px;
            flex-wrap: wrap;
          }
          .nav a {
            color: #e6efff;
            text-decoration: none;
            padding: 10px 13px;
            border-radius: 7px;
            font-size: 13px;
            font-weight: bold;
          }
          .nav a:hover { background: #315789; }
          .content { max-width: 1450px; margin: auto; padding: 30px 4%; }
          .welcome {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
            margin-bottom: 25px;
          }
          .welcome h1 { font-size: 28px; margin: 0 0 8px; }
          .muted { color: #73819a; font-size: 14px; }
          .section-title { font-size: 20px; margin: 32px 0 17px; }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 17px;
          }
          .stat {
            background: white;
            border: 1px solid #e4eaf3;
            border-radius: 13px;
            padding: 22px;
            box-shadow: 0 3px 12px rgba(25,45,80,.04);
          }
          .stat-label { color: #71809a; font-size: 13px; font-weight: 600; }
          .stat-number { font-size: 32px; font-weight: 800; margin-top: 13px; color: #183c73; }
          .stat-icon { font-size: 23px; margin-bottom: 12px; }
          .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
            gap: 18px;
          }
          .panel {
            background: white;
            border: 1px solid #e4eaf3;
            border-radius: 13px;
            padding: 21px;
            box-shadow: 0 3px 12px rgba(25,45,80,.04);
            min-width: 0;
          }
          .panel h3 { margin: 0 0 16px; font-size: 18px; }
          .metric-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin: 12px 0;
            font-size: 14px;
          }
          .metric-row span { color: #73819a; }
          .progress {
            height: 10px;
            background: #e9eef7;
            border-radius: 20px;
            overflow: hidden;
            margin: 9px 0 18px;
          }
          .progress-inner { height: 100%; background: #3275d5; border-radius: 20px; }
          .student {
            background: #f5f8fd;
            padding: 12px;
            border-radius: 9px;
            margin-top: 9px;
            font-size: 13px;
          }
          .student strong { color: #203f70; }
          .student p { margin: 6px 0 0; color: #71809a; overflow-wrap: anywhere; }
          .set-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            padding: 11px 0;
            border-bottom: 1px solid #edf0f5;
            font-size: 13px;
          }
          .answer-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 16px;
          }
          .answer-box {
            background: #f4f7fc;
            border-radius: 8px;
            text-align: center;
            padding: 12px 5px;
          }
          .answer-box strong { display: block; font-size: 20px; margin-bottom: 5px; }
          .answer-box small { color: #73819a; font-size: 11px; }
          .recent-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 15px;
          }
          .recent {
            background: white;
            border: 1px solid #e4eaf3;
            border-radius: 12px;
            padding: 18px;
          }
          .recent p { font-size: 13px; color: #71809a; margin: 10px 0; }
          .score {
            display: inline-block;
            background: #e9f3ff;
            color: #205a9e;
            padding: 6px 10px;
            border-radius: 7px;
            font-weight: bold;
            font-size: 13px;
          }
          .empty {
            background: white;
            border-radius: 12px;
            padding: 25px;
            color: #71809a;
            text-align: center;
          }
          .footer { text-align: center; color: #8793a7; font-size: 12px; margin-top: 40px; }
          @media(max-width: 600px) {
            .content { padding: 22px 15px; }
            .topbar { padding: 18px 15px; }
            .nav { padding: 10px; }
            .nav a { font-size: 12px; padding: 9px; }
            .welcome h1 { font-size: 23px; }
            .category-grid { grid-template-columns: 1fr; }
            .answer-box strong { font-size: 17px; }
          }
        `}</style>

        <header className="topbar">
          <div className="brand">
            STATE SSC & PCS
            <small>ADMINISTRATION PANEL</small>
          </div>

          <div className="admin-info">
            <span>Welcome, {admin.name}</span>
            <form action="/api/admin/logout" method="POST">
              <button className="logout" type="submit">
                Logout ↗
              </button>
            </form>
          </div>
        </header>

        <nav className="nav">
          {navLinks.map((link) => (
            <a href={link.href} key={link.href}>
              {link.icon} {link.label}
            </a>
          ))}
        </nav>

        <div className="content">
          <section className="welcome">
            <div>
              <h1>Admin Dashboard</h1>
              <div className="muted">
                Manage your examination platform from one place.
              </div>
            </div>
            <div className="muted">{admin.email}</div>
          </section>

          <h2 className="section-title">Website Overview</h2>

          <section className="stats">
            <div className="stat">
              <div className="stat-icon">📝</div>
              <div className="stat-label">TOTAL MOCK TESTS</div>
              <div className="stat-number">{totalTests}</div>
            </div>
            <div className="stat">
              <div className="stat-icon">👨‍🎓</div>
              <div className="stat-label">TOTAL STUDENTS</div>
              <div className="stat-number">{totalStudents}</div>
            </div>
            <div className="stat">
              <div className="stat-icon">📊</div>
              <div className="stat-label">EXAM ATTEMPTS</div>
              <div className="stat-number">{totalResults}</div>
            </div>
            <div className="stat">
              <div className="stat-icon">📚</div>
              <div className="stat-label">TOTAL QUESTIONS</div>
              <div className="stat-number">{totalQuestions}</div>
            </div>
            <div className="stat">
              <div className="stat-icon">🏆</div>
              <div className="stat-label">EXAM CATEGORIES</div>
              <div className="stat-number">{examGroups.length}</div>
            </div>
          </section>

          <h2 className="section-title">Category-wise Exam Analysis</h2>

          {examGroupStats.length === 0 ? (
            <div className="empty">No exam categories available.</div>
          ) : (
            <section className="category-grid">
              {examGroupStats.map((exam) => (
                <div className="panel" key={exam.id}>
                  <h3>{exam.name}</h3>

                  <div className="metric-row">
                    <span>Total Sets</span>
                    <strong>{exam.sets.length}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Total Attempts</span>
                    <strong>{exam.attempts}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Average Percentage</span>
                    <strong>{exam.averagePercentage}%</strong>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-inner"
                      style={{
                        width: `${Math.min(100, Math.max(0, exam.averagePercentage))}%`,
                      }}
                    />
                  </div>
                  <div className="metric-row">
                    <span>Highest Percentage</span>
                    <strong>{exam.highestPercentage}%</strong>
                  </div>

                  <div className="answer-grid">
                    <div className="answer-box">
                      <strong>{exam.correctAnswers}</strong>
                      <small>Correct</small>
                    </div>
                    <div className="answer-box">
                      <strong>{exam.wrongAnswers}</strong>
                      <small>Wrong</small>
                    </div>
                    <div className="answer-box">
                      <strong>{exam.unattemptedAnswers}</strong>
                      <small>Skipped</small>
                    </div>
                  </div>

                  <h3 style={{ marginTop: 25 }}>🏆 Top 5 Students</h3>

                  {exam.topStudents.length === 0 ? (
                    <p className="muted">No student results available.</p>
                  ) : (
                    exam.topStudents.map((student, index) => (
                      <div className="student" key={student.id}>
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

                  <h3 style={{ marginTop: 25 }}>Set-wise Performance</h3>

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
                      <div className="set-row" key={set.id}>
                        <strong>
                          {set.setNumber
                            ? `Set ${set.setNumber}`
                            : set.title}
                        </strong>
                        <span>
                          {setAttempts} attempts | {Math.round(setAverage)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </section>
          )}

          <h2 className="section-title">Recent Exam Attempts</h2>

          {recentResults.length === 0 ? (
            <div className="empty">No exam attempts yet.</div>
          ) : (
            <section className="recent-grid">
              {recentResults.map((result) => (
                <div className="recent" key={result.id}>
                  <strong>
                    {result.student?.name || "Unknown Student"}
                  </strong>
                  <p>Exam: {result.test.title}</p>
                  <div className="score">
                    Score: {result.score} / {result.totalQuestions}
                  </div>
                  <p>
                    Percentage:{" "}
                    {result.totalQuestions > 0
                      ? Math.round(
                          (result.score / result.totalQuestions) * 100
                        )
                      : 0}
                    %
                  </p>
                  <small className="muted">
                    {new Date(result.createdAt).toLocaleString("en-IN")}
                  </small>
                </div>
              ))}
            </section>
          )}

          <div className="footer">
            State SSC & PCS Mock Exam Platform | Administration Dashboard
          </div>
        </div>
      </main>
    );
  } catch {
    redirect("/admin-login");
  }
}
