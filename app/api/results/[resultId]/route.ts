
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // Verify student login
    const cookieStore = await cookies();
    const token = cookieStore.get("student_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return NextResponse.json(
        { error: "Invalid session." },
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
        { error: "Invalid session." },
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
        { error: "Session expired." },
        { status: 401 }
      );
    }

    // Get result ID
    const { resultId } = await params;
    const id = Number(resultId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid result ID." },
        { status: 400 }
      );
    }

    // Find only this student's result
    const result = await prisma.examResult.findFirst({
      where: {
        id,
        studentId: session.studentId,
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Result not found." },
        { status: 404 }
      );
    }

    // Calculate ranking for this test
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
        ? Math.round((result.score / result.totalQuestions) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        testId: result.testId,
        testTitle: result.test.title,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage,
        rank: studentsAhead + 1,
        totalParticipants,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error("Result API error:", error);

    return NextResponse.json(
      { error: "Could not load result." },
      { status: 500 }
    );
  }
}
