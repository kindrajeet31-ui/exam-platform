
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
        { error: "Server configuration error." },
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

    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
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
      typeof session.adminId !== "number" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return NextResponse.json(
        { error: "Admin session expired." },
        { status: 401 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account not found." },
        { status: 401 }
      );
    }

    // 2. Read question data
    const body = await request.json();

    const testId = Number(body.testId);
    const subject =
  typeof body.subject === "string" ? body.subject.trim() : "";

const topic =
  typeof body.topic === "string" ? body.topic.trim() : "";

const questionText =
  typeof body.questionText === "string"
    ? body.questionText.trim()
    : "";

const optionA =
  typeof body.optionA === "string" ? body.optionA.trim() : "";

const optionB =
  typeof body.optionB === "string" ? body.optionB.trim() : "";

const optionC =
  typeof body.optionC === "string" ? body.optionC.trim() : "";

const optionD =
  typeof body.optionD === "string" ? body.optionD.trim() : "";

// Hindi fields
const questionTextHi =
  typeof body.questionTextHi === "string"
    ? body.questionTextHi.trim()
    : "";

const optionAHi =
  typeof body.optionAHi === "string" ? body.optionAHi.trim() : "";

const optionBHi =
  typeof body.optionBHi === "string" ? body.optionBHi.trim() : "";

const optionCHi =
  typeof body.optionCHi === "string" ? body.optionCHi.trim() : "";

const optionDHi =
  typeof body.optionDHi === "string" ? body.optionDHi.trim() : "";

const correctAnswer = body.correctAnswer;

const explanation =
  typeof body.explanation === "string"
    ? body.explanation.trim()
    : "";

const explanationHi =
  typeof body.explanationHi === "string"
    ? body.explanationHi.trim()
    : "";

    // 3. Validate data
    if (!Number.isInteger(testId) || testId < 1) {
      return NextResponse.json(
        { error: "Please select a valid mock test." },
        { status: 400 }
      );
    }

    if (
      !questionText ||
      !optionA ||
      !optionB ||
      !optionC ||
      !optionD
    ) {
      return NextResponse.json(
        { error: "Please fill in the question and all four options." },
        { status: 400 }
      );
    }

    if (!["A", "B", "C", "D"].includes(correctAnswer)) {
      return NextResponse.json(
        { error: "Please select a valid correct answer." },
        { status: 400 }
      );
    }

    // 4. Check whether the test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { id: true },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Selected mock test does not exist." },
        { status: 404 }
      );
    }

    // 5. Save question to database
const question = await prisma.question.create({
  data: {
    testId,
    subject: subject || null,
    topic: topic || null,
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,

    // Hindi fields
    questionTextHi: questionTextHi || null,
    optionAHi: optionAHi || null,
    optionBHi: optionBHi || null,
    optionCHi: optionCHi || null,
    optionDHi: optionDHi || null,
    explanationHi: explanationHi || null,

    correctAnswer,
    explanation: explanation || null,
  },
});

    return NextResponse.json(
      {
        success: true,
        message: "Question added successfully.",
        question,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add question error:", error);

    return NextResponse.json(
      { error: "Unable to save question." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // Check admin session
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Admin login required." },
        { status: 401 }
      );
    }

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

    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
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
      typeof session.adminId !== "number" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return NextResponse.json(
        { error: "Admin session expired." },
        { status: 401 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account not found." },
        { status: 401 }
      );
    }

    // Read selected test ID from URL
    const { searchParams } = new URL(request.url);
    const testId = Number(searchParams.get("testId"));

    if (!Number.isSafeInteger(testId) || testId < 1) {
      return NextResponse.json(
        { error: "Please provide a valid test ID." },
        { status: 400 }
      );
    }

    // Check whether test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { id: true },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Mock test not found." },
        { status: 404 }
      );
    }

    // Fetch questions
    const questions = await prisma.question.findMany({
      where: { testId },
select: {
  id: true,
  subject: true,
topic: true,
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

  correctAnswer: true,
  explanation: true,
  explanationHi: true,
},
      orderBy: { id: "asc" },
    });

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error("Get questions error:", error);

    return NextResponse.json(
      { error: "Unable to load questions." },
      { status: 500 }
    );
  }
}

// UPDATE an existing question
export async function PUT(request: NextRequest) {
  try {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const [payload, signature] = token.split(".");

    if (!payload || !signature) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );

    if (
      typeof session.adminId !== "number" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return NextResponse.json(
        { error: "Session expired." },
        { status: 401 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = Number(body.id);
const {
  subject,
  topic,
  questionText,
  optionA,
  optionB,
  optionC,
  optionD,
  questionTextHi,
  optionAHi,
  optionBHi,
  optionCHi,
  optionDHi,
  correctAnswer,
  explanation,
  explanationHi,
} = body;

    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "Invalid question ID." },
        { status: 400 }
      );
    }

    if (
      !questionText?.trim() ||
      !optionA?.trim() ||
      !optionB?.trim() ||
      !optionC?.trim() ||
      !optionD?.trim() ||
      !correctAnswer?.trim()
    ) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

const question = await prisma.question.update({
  where: { id },
data: {
  subject: typeof subject === "string" ? subject.trim() || null : null,
  topic: typeof topic === "string" ? topic.trim() || null : null,

  questionText: questionText.trim(),
    optionA: optionA.trim(),
    optionB: optionB.trim(),
    optionC: optionC.trim(),
    optionD: optionD.trim(),

    questionTextHi: questionTextHi?.trim() || null,
    optionAHi: optionAHi?.trim() || null,
    optionBHi: optionBHi?.trim() || null,
    optionCHi: optionCHi?.trim() || null,
    optionDHi: optionDHi?.trim() || null,

    correctAnswer: correctAnswer.trim(),
    explanation: explanation?.trim() || null,
    explanationHi: explanationHi?.trim() || null,
  },
});
    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error) {
    console.error("Update question error:", error);

    return NextResponse.json(
      { error: "Unable to update question." },
      { status: 500 }
    );
  }
}

// DELETE an existing question
export async function DELETE(request: NextRequest) {
  try {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const [payload, signature] = token.split(".");

    if (!payload || !signature) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );

    if (
      typeof session.adminId !== "number" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return NextResponse.json(
        { error: "Session expired." },
        { status: 401 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "Invalid question ID." },
        { status: 400 }
      );
    }

    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (error) {
    console.error("Delete question error:", error);

    return NextResponse.json(
      { error: "Unable to delete question." },
      { status: 500 }
    );
  }
}
