
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { message: "Server configuration error." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("student_session")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Please log in first." },
        { status: 401 }
      );
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return NextResponse.json(
        { message: "Invalid session." },
        { status: 401 }
      );
    }

    const [payload, signature] = parts;

    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const receivedBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expectedSignature, "base64url");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { message: "Invalid session." },
        { status: 401 }
      );
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      !Number.isSafeInteger(session.studentId) ||
      !Number.isSafeInteger(session.expiresAt) ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return NextResponse.json(
        { message: "Session expired." },
        { status: 401 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: session.studentId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student not found." },
        { status: 401 }
      );
    }

    const results = await prisma.examResult.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        test: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const resultsWithRanking = await Promise.all(
      results.map(async (result) => {
        const studentsAhead = await prisma.examResult.count({
          where: {
            testId: result.testId,
            score: {
              gt: result.score,
            },
          },
        });

        const totalParticipants = await prisma.examResult.count({
          where: {
            testId: result.testId,
          },
        });

        const percentage =
          result.totalQuestions > 0
            ? Math.round(
                (result.score / result.totalQuestions) * 100
              )
            : 0;

        return {
          ...result,
          percentage,
          rank: studentsAhead + 1,
          totalParticipants,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        totalResults: results.length,
        results: resultsWithRanking,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Results fetch error:", error);

    return NextResponse.json(
      { error: "Could not fetch exam results." },
      { status: 500 }
    );
  }
}
