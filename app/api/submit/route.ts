
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const optionLetters = ["A", "B", "C", "D"];

export async function POST(request: Request) {
  try {
    // 1. Verify login session
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

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
    const expectedBuffer = Buffer.from(
      expectedSignature,
      "base64url"
    );

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
        { error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    // 2. Confirm student exists
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

    // 3. Read exam submission
    const body = await request.json();
    const { testId, answers } = body;

    if (
      !Number.isInteger(testId) ||
      testId <= 0 ||
      !Array.isArray(answers)
    ) {
      return NextResponse.json(
        { error: "Invalid test submission." },
        { status: 400 }
      );
    }

    // 4. Find test and questions
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Test not found." },
        { status: 404 }
      );
    }

    const questions = test.questions;

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "This test has no questions." },
        { status: 400 }
      );
    }

    // 5. Validate submitted answers
    const submittedAnswers = new Map<number, number>();

    for (const answer of answers) {
      if (
        !answer ||
        !Number.isInteger(answer.questionId) ||
        !Number.isInteger(answer.selectedOption) ||
        submittedAnswers.has(answer.questionId)
      ) {
        return NextResponse.json(
          { error: "Invalid answer format." },
          { status: 400 }
        );
      }

      submittedAnswers.set(
        answer.questionId,
        answer.selectedOption
      );
    }

    if (
      submittedAnswers.size !== questions.length ||
      questions.some(
        (question) => !submittedAnswers.has(question.id)
      )
    ) {
      return NextResponse.json(
        { error: "Answers do not match this test." },
        { status: 400 }
      );
    }

    // 6. Check answers
    const reviewedAnswers = questions.map((question) => {
      const selectedOption = submittedAnswers.get(question.id)!;

      const options = [
        question.optionA,
        question.optionB,
        question.optionC,
        question.optionD,
      ];

      const correctAnswer = optionLetters.indexOf(
        question.correctAnswer
      );

      if (
        selectedOption < -1 ||
        selectedOption >= options.length ||
        correctAnswer === -1
      ) {
        throw new Error("Invalid answer data in database.");
      }

      return {
        questionId: question.id,
        question: question.questionText,
        options,
        selectedOption,
        correctAnswer,
        isCorrect: selectedOption === correctAnswer,
        explanation: question.explanation || "",
      };
    });

    // 7. Calculate score
    const score = reviewedAnswers.filter(
      (answer) => answer.isCorrect
    ).length;
// Check whether this student has already submitted this test
const existingResult = await prisma.examResult.findFirst({
  where: {
    studentId: student.id,
    testId: test.id,
  },
  select: {
    id: true,
  },
});

if (existingResult) {
  return NextResponse.json(
    {
      error: "You have already submitted this exam.",
    },
    { status: 409 }
  );
}
// 8. Save result and all individual answers
const savedResult = await prisma.$transaction(async (tx) => {
  const result = await tx.examResult.create({
    data: {
      studentId: student.id,
      testId: test.id,
      score,
      totalQuestions: questions.length,
    },
  });

  await tx.studentAnswer.createMany({
    data: reviewedAnswers.map((answer) => ({
      examResultId: result.id,
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      isCorrect: answer.isCorrect,
    })),
  });

  return result;
}, {
  maxWait: 10000,
  timeout: 30000,
});
    // 9. Calculate percentage and ranking
const percentage = Math.round(
  (score / questions.length) * 100
);

const studentsAhead = await prisma.examResult.count({
  where: {
    testId: test.id,
    score: {
      gt: score,
    },
  },
});

const totalParticipants = await prisma.examResult.count({
  where: {
    testId: test.id,
  },
});

const rank = studentsAhead + 1;

return NextResponse.json({
  success: true,
  message: "Exam result saved successfully!",
  resultId: savedResult.id,
  score,
  totalQuestions: questions.length,
  percentage,
  rank,
  totalParticipants,
  reviewedAnswers,
});
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You have already submitted this exam." },
        { status: 409 }
      );
    }

    console.error("Submission error:", error);

    return NextResponse.json(
      { error: "Could not process or save the submission." },
      { status: 500 }
    );
  }
}
