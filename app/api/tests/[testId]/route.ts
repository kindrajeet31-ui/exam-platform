
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    // Check session secret
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { error: "Server session configuration error." },
        { status: 500 }
      );
    }

    // Read login cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("student_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    // Verify session token
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

    // Confirm student still exists
    const student = await prisma.student.findUnique({
      where: { id: session.studentId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 401 }
      );
    }

    // Validate test ID
    const { testId: id } = await params;
    const testId = Number(id);

    if (!Number.isInteger(testId) || testId <= 0) {
      return NextResponse.json(
        { error: "Invalid test ID." },
        { status: 400 }
      );
    }

// Check whether the test exists and is available
const availability = await prisma.test.findUnique({
  where: { id: testId },
  select: {
    isPublished: true,
    availableFrom: true,
  },
});

if (!availability) {
  return NextResponse.json(
    { error: "Test not found." },
    { status: 404 }
  );
}

const isAvailable =
  availability.isPublished ||
  (!!availability.availableFrom &&
    availability.availableFrom.getTime() <= Date.now());

if (!isAvailable) {
  return NextResponse.json(
    { error: "This test is not available yet. Please come back at its release time." },
    { status: 403 }
  );
}
// Check whether this student has already completed this test
const existingResult = await prisma.examResult.findFirst({
  where: {
    studentId: student.id,
    testId: testId,
  },
  select: {
    id: true,
  },
});

if (existingResult) {
  return NextResponse.json(
    {
      error: "You have already completed this exam.",
    },
    { status: 409 }
  );
}

// Fetch test questions
const test = await prisma.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        questions: {
          select: {
            id: true,
            questionText: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            questionTextHi: true,
optionAHi: true,
optionBHi: true,
optionCHi: true,
optionDHi: true,
explanationHi: true,
            
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Test not found." },
        { status: 404 }
      );
    }
        if (test.questions.length === 0) {
      return NextResponse.json(
        { error: "This exam set has no questions available yet." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, test },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Single test API error:", error);

    return NextResponse.json(
      { error: "Could not fetch test." },
      { status: 500 }
    );
  }
}
