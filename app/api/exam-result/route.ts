import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Verify session
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
    const { searchParams } = new URL(request.url);
    const resultId = Number(searchParams.get("resultId"));

    if (!Number.isSafeInteger(resultId) || resultId <= 0) {
      return NextResponse.json(
        { error: "Invalid result ID." },
        { status: 400 }
      );
    }

    // Fetch only this student's result
    const result = await prisma.examResult.findFirst({
      where: {
        id: resultId,
        studentId: session.studentId,
      },
      include: {
        test: {
          select: {
            title: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                subject: true,
                topic: true,
                questionText: true,
                questionTextHi: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                optionAHi: true,
                optionBHi: true,
                optionCHi: true,
                optionDHi: true,
                explanation: true,
                explanationHi: true,
                correctAnswer: true,
              },
            },
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

    const reviewedAnswers = result.answers.map((answer) => {
      const question = answer.question;

      const options = [
        question.optionA,
        question.optionB,
        question.optionC,
        question.optionD,
      ];

      const optionLetters = ["A", "B", "C", "D"];
      const correctAnswer = optionLetters.indexOf(
        question.correctAnswer
      );

      return {
        questionId: answer.questionId,
        subject: question.subject || "Not categorized",
        topic: question.topic || "Not categorized",
        question: question.questionText,
        questionHi: question.questionTextHi,
        options,
        optionsHi: [
          question.optionAHi,
          question.optionBHi,
          question.optionCHi,
          question.optionDHi,
        ],
        selectedOption: answer.selectedOption,
        correctAnswer,
        isCorrect: answer.isCorrect,
        explanation: question.explanation || "",
        explanationHi: question.explanationHi || "",
      };
    });

    const correct = reviewedAnswers.filter(
      (answer) => answer.isCorrect
    ).length;

    const wrong = reviewedAnswers.filter(
      (answer) =>
        answer.selectedOption !== -1 && !answer.isCorrect
    ).length;

    const unattempted = reviewedAnswers.filter(
      (answer) => answer.selectedOption === -1
    ).length;

    return NextResponse.json({
      success: true,
      resultId: result.id,
      testTitle: result.test.title,
      score: result.score,
      totalQuestions: result.totalQuestions,
      percentage: Math.round(
        (result.score / result.totalQuestions) * 100
      ),
      correct,
      wrong,
      unattempted,
      reviewedAnswers,
    });
  } catch (error) {
    console.error("Exam result error:", error);

    return NextResponse.json(
      { error: "Could not load exam result." },
      { status: 500 }
    );
  }
}