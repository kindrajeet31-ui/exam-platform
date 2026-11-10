
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function verifySession(
  token: string | undefined,
  sessionField: "studentId" | "adminId"
): Promise<number | null> {
  if (!token) return null;

  try {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;

    const expected = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      return null;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      !Number.isSafeInteger(session[sessionField]) ||
      !Number.isSafeInteger(session.expiresAt) ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return session[sessionField];
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    const studentId = await verifySession(
      cookieStore.get("student_session")?.value,
      "studentId"
    );

    const adminId = await verifySession(
      cookieStore.get("admin_session")?.value,
      "adminId"
    );

    let authorized = false;

    if (studentId !== null) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true },
      });

      authorized = Boolean(student);
    }

    if (!authorized && adminId !== null) {
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { id: true },
      });

      authorized = Boolean(admin);
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const results = await prisma.examResult.findMany({
      where: {
        studentId: { not: null },
      },
      select: {
        id: true,
        score: true,
        totalQuestions: true,
        createdAt: true,
student: {
  select: {
    id: true,
    name: true,
  },
},
        test: {
          select: {
            id: true,
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
      orderBy: [
        { score: "desc" },
        { createdAt: "asc" },
      ],
    });

    const leaderboard = await Promise.all(
      results.map(async (result) => {
        const studentsAhead = await prisma.examResult.count({
          where: {
            testId: result.test.id,
            score: {
              gt: result.score,
            },
          },
        });

        const totalParticipants = await prisma.examResult.count({
          where: {
            testId: result.test.id,
          },
        });

        const percentage =
          result.totalQuestions > 0
            ? Math.round(
                (result.score / result.totalQuestions) * 100
              )
            : 0;

return {
  id: result.id,
  studentId: result.student?.id,
  testId: result.test.id,
  studentName: result.student?.name || "Student",
          examName: result.test.exam?.name || result.test.title,
          setNumber: result.test.setNumber,
          testTitle: result.test.title,
          score: result.score,
          totalQuestions: result.totalQuestions,
          percentage,
          rank: studentsAhead + 1,
          totalParticipants,
          createdAt: result.createdAt,
        };
      })
    );
// Keep only each student's best attempt for each test set
const bestAttempts = new Map<
  string,
  (typeof leaderboard)[number]
>();

for (const result of leaderboard) {
  const key = `${result.studentId}-${result.testId}`;
  const existing = bestAttempts.get(key);

  if (
    !existing ||
    result.percentage > existing.percentage ||
    (
      result.percentage === existing.percentage &&
      result.score > existing.score
    ) ||
    (
      result.percentage === existing.percentage &&
      result.score === existing.score &&
      new Date(result.createdAt).getTime() <
        new Date(existing.createdAt).getTime()
    )
  ) {
    bestAttempts.set(key, result);
  }
}

const uniqueLeaderboard = Array.from(bestAttempts.values());
// Recalculate rank using only each student's best attempt
const rankedLeaderboard = uniqueLeaderboard.map((result) => {
  const sameTestResults = uniqueLeaderboard.filter(
    (item) => item.testId === result.testId
  );

  const studentsAhead = sameTestResults.filter(
    (item) =>
      item.percentage > result.percentage ||
      (
        item.percentage === result.percentage &&
        item.score > result.score
      )
  ).length;

  return {
    ...result,
    rank: studentsAhead + 1,
    totalParticipants: sameTestResults.length,
  };
});

    return NextResponse.json(
{
  success: true,
leaderboard: rankedLeaderboard,
},
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Leaderboard error:", error);

    return NextResponse.json(
      { error: "Unable to load leaderboard." },
      { status: 500 }
    );
  }
}
