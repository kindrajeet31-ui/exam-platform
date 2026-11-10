
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStudentId(): Promise<number | null> {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get("student_session")?.value;

  if (!token) return null;

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

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      !Number.isSafeInteger(session.studentId) ||
      !Number.isSafeInteger(session.expiresAt) ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    const student = await prisma.student.findUnique({
      where: { id: session.studentId },
      select: { id: true },
    });

    return student?.id ?? null;
  } catch {
    return null;
  }
}
// Get reports submitted by the logged-in student
export async function GET() {
  try {
    const studentId = await getStudentId();

    if (!studentId) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const reports = await prisma.questionReport.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        question: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Fetch student reports error:", error);

    return NextResponse.json(
      { error: "Unable to fetch your reports." },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const studentId = await getStudentId();

    if (!studentId) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const questionId = Number(body.questionId);
    const category =
      typeof body.category === "string" ? body.category.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const allowedCategories = [
      "Incorrect question",
      "Wrong answer",
      "Incorrect Hindi translation",
      "Typing mistake",
      "Other",
    ];

    if (!Number.isSafeInteger(questionId) || questionId <= 0) {
      return NextResponse.json(
        { error: "Valid question ID is required." },
        { status: 400 }
      );
    }

    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { error: "Please select a valid report category." },
        { status: 400 }
      );
    }

    if (description.length > 1000) {
      return NextResponse.json(
        { error: "Description cannot exceed 1000 characters." },
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found." },
        { status: 404 }
      );
    }

    const report = await prisma.questionReport.create({
      data: {
        studentId,
        questionId,
        category,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Question report submitted successfully.",
      reportId: report.id,
    });
  } catch (error) {
    console.error("Submit question report error:", error);

    return NextResponse.json(
      { error: "Unable to submit question report." },
      { status: 500 }
    );
  }
}
