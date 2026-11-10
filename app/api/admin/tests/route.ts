
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Check admin session
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { error: "Server security configuration error." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Admin login required." },
        { status: 401 }
      );
    }

    // 2. Verify session token
    const [payload, signature] = token.split(".");

    if (!payload || !signature) {
      return NextResponse.json(
        { error: "Invalid admin session." },
        { status: 401 }
      );
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);

    if (
      expectedBuffer.length !== actualBuffer.length ||
      !timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid admin session." },
        { status: 401 }
      );
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      !session.adminId ||
      !session.expiresAt ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return NextResponse.json(
        { error: "Admin session expired." },
        { status: 401 }
      );
    }

    // 3. Confirm admin exists
    const admin = await prisma.admin.findUnique({
      where: { id: Number(session.adminId) },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found." },
        { status: 401 }
      );
    }

    // 4. Read test information
    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

const duration = Number(body.duration);
const examId = Number(body.examId);
const setNumber = Number(body.setNumber);

// Scheduling information
const availableFrom =
  typeof body.availableFrom === "string" && body.availableFrom.trim()
    ? new Date(body.availableFrom)
    : null;

const isPublished =
  typeof body.isPublished === "boolean" ? body.isPublished : true;
  if (
  availableFrom &&
  Number.isNaN(availableFrom.getTime())
) {
  return NextResponse.json(
    { error: "Please enter a valid availability date and time." },
    { status: 400 }
  );
}

    if (!title) {
      return NextResponse.json(
        { error: "Test title is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 300
    ) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 300 minutes." },
        { status: 400 }
      );
    }
if (
  !Number.isInteger(examId) ||
  examId <= 0 ||
  !Number.isInteger(setNumber) ||
  setNumber < 1
) {
  return NextResponse.json(
    { error: "Please select an exam and enter a valid set number." },
    { status: 400 }
  );
}

const selectedExam = await prisma.exam.findUnique({
  where: { id: examId },
});

if (!selectedExam) {
  return NextResponse.json(
    { error: "Selected exam not found." },
    { status: 404 }
  );
}

const existingSet = await prisma.test.findFirst({
  where: {
    examId,
    setNumber,
  },
});

if (existingSet) {
  return NextResponse.json(
    { error: `Set ${setNumber} already exists in this exam.` },
    { status: 400 }
  );
}

    // 5. Save test in database
const test = await prisma.test.create({
  data: {
    title,
    description: description || null,
    duration,
    exam: {
      connect: { id: examId },
    },
    setNumber,
    availableFrom,
    isPublished,
  },
});

    return NextResponse.json({
      success: true,
      message: "Mock test created successfully.",
      test,
    });
  } catch (error) {
    console.error("Create test error:", error);

    return NextResponse.json(
      { error: "Unable to create test." },
      { status: 500 }
    );
  }
}
