
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    // Check session expiration
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

    // Confirm student exists
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

    // Fetch available tests
    const tests = await prisma.test.findMany({
      orderBy: {
        createdAt: "desc",
      },
select: {
  id: true,
  title: true,
  description: true,
  duration: true,
  availableFrom: true,
  isPublished: true,
  _count: {
          select: {
            questions: true,
          },
        },
      },
    });


    const safeTests = tests.map((test) => {
      const releaseTime = test.availableFrom
        ? new Date(test.availableFrom).getTime()
        : 0;

      const isAvailable =
        test.isPublished ||
        (!!test.availableFrom && releaseTime <= Date.now());

      return {
        id: test.id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        questionCount: test._count.questions,
        availableFrom: test.availableFrom,
        isPublished: test.isPublished,
        isAvailable,
      };
    });

const exams = await prisma.exam.findMany({
  orderBy: {
    createdAt: "desc",
  },
  include: {
    tests: {
      orderBy: {
        setNumber: "asc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        setNumber: true,
        availableFrom: true,
        isPublished: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    },
  },
});

const safeExams = exams.map((exam) => ({
  id: exam.id,
  name: exam.name,
  description: exam.description,
  sets: exam.tests.map((test) => {
    const releaseTime = test.availableFrom
      ? new Date(test.availableFrom).getTime()
      : 0;

const isAvailable =
  test.isPublished ||
  (!!test.availableFrom && releaseTime <= Date.now());

    return {
      id: test.id,
      title: test.title,
      setNumber: test.setNumber,
      description: test.description,
      duration: test.duration,
      questionCount: test._count.questions,
      availableFrom: test.availableFrom,
      isPublished: test.isPublished,
      isAvailable,
    };
  }),
}));

    return NextResponse.json(
      {
       success: true,
tests: safeTests,
exams: safeExams,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Tests API error:", error);

    return NextResponse.json(
      { error: "Could not fetch tests." },
      { status: 500 }
    );
  }
}
