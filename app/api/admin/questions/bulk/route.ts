
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin session
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

    // 2. Read uploaded questions
    const body = await request.json();
    const testId = Number(body.testId);
    const questions = body.questions;

    if (!Number.isSafeInteger(testId) || testId < 1) {
      return NextResponse.json(
        { error: "Please select a valid mock test." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(questions) ||
      questions.length === 0 ||
      questions.length > 500
    ) {
      return NextResponse.json(
        { error: "Upload between 1 and 500 questions." },
        { status: 400 }
      );
    }

    // 3. Check whether test exists
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

    // 4. Validate every question before saving
    const preparedQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const item = questions[i];

      const questionText =
        typeof item.questionText === "string"
          ? item.questionText.trim()
          : "";

      const optionA =
        typeof item.optionA === "string" ? item.optionA.trim() : "";
      const optionB =
        typeof item.optionB === "string" ? item.optionB.trim() : "";
      const optionC =
        typeof item.optionC === "string" ? item.optionC.trim() : "";
      const optionD =
        typeof item.optionD === "string" ? item.optionD.trim() : "";

      const correctAnswer =
        typeof item.correctAnswer === "string"
          ? item.correctAnswer.trim().toUpperCase()
          : "";

      const explanation =
        typeof item.explanation === "string"
          ? item.explanation.trim()
          : "";
          const subject =
  typeof item.subject === "string" ? item.subject.trim() : "";

const topic =
  typeof item.topic === "string" ? item.topic.trim() : "";
          // Hindi question and options
const questionTextHi =
  typeof item.questionTextHi === "string"
    ? item.questionTextHi.trim()
    : "";

const optionAHi =
  typeof item.optionAHi === "string" ? item.optionAHi.trim() : "";

const optionBHi =
  typeof item.optionBHi === "string" ? item.optionBHi.trim() : "";

const optionCHi =
  typeof item.optionCHi === "string" ? item.optionCHi.trim() : "";

const optionDHi =
  typeof item.optionDHi === "string" ? item.optionDHi.trim() : "";

const explanationHi =
  typeof item.explanationHi === "string"
    ? item.explanationHi.trim()
    : "";

      if (
        !questionText ||
        !optionA ||
        !optionB ||
        !optionC ||
        !optionD ||
        !["A", "B", "C", "D"].includes(correctAnswer)
      ) {
        return NextResponse.json(
          {
            error: `Invalid question or options at CSV row ${i + 2}. Check all required fields and the correct answer.`,
          },
          { status: 400 }
        );
      }

preparedQuestions.push({
  testId,
  subject: subject || null,
  topic: topic || null,
  questionText,
  optionA,
  optionB,
  optionC,
  optionD,
  correctAnswer,
  explanation: explanation || null,

  questionTextHi: questionTextHi || null,
  optionAHi: optionAHi || null,
  optionBHi: optionBHi || null,
  optionCHi: optionCHi || null,
  optionDHi: optionDHi || null,
  explanationHi: explanationHi || null,
});
    }

// 5. Prevent duplicate questions
const existingQuestions = await prisma.question.findMany({
  where: { testId },
  select: {
    questionText: true,
    optionA: true,
    optionB: true,
    optionC: true,
    optionD: true,
  },
});

const makeQuestionKey = (q: {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}) =>
  JSON.stringify([
    q.questionText,
    q.optionA,
    q.optionB,
    q.optionC,
    q.optionD,
  ].map((value) => value.trim().replace(/\s+/g, " ").toLowerCase()));

const existingKeys = new Set(
  existingQuestions.map((q) => makeQuestionKey(q))
);

let savedCount = 0;
let skippedCount = 0;

for (const question of preparedQuestions) {
  const key = makeQuestionKey(question);

  if (existingKeys.has(key)) {
    skippedCount++;
    continue;
  }

  await prisma.question.create({
    data: question,
  });

  existingKeys.add(key);
  savedCount++;
}

return NextResponse.json(
  {
    success: true,
    message: `Uploaded ${savedCount} questions. Skipped ${skippedCount} duplicates.`,
    savedCount,
    skippedCount,
  },
  { status: 201 }
);

    return NextResponse.json(
      {
        success: true,
        message: "Bulk questions uploaded successfully.",
        savedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Bulk question upload error:", error);

    return NextResponse.json(
      { error: "Unable to upload questions." },
      { status: 500 }
    );
  }
}
