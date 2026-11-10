
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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

    const expected = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

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

    const body = await request.json();

    const testId = Number(body.testId);
    const questionIds = body.questionIds;
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";
    const topic =
      typeof body.topic === "string" ? body.topic.trim() : "";

    if (!Number.isSafeInteger(testId) || testId < 1) {
      return NextResponse.json(
        { error: "Invalid test ID." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(questionIds) ||
      questionIds.length === 0 ||
      questionIds.length > 500 ||
      !questionIds.every(
        (id: unknown) =>
          Number.isSafeInteger(id) && Number(id) > 0
      )
    ) {
      return NextResponse.json(
        { error: "Select between 1 and 500 valid questions." },
        { status: 400 }
      );
    }

    if (!subject || !topic) {
      return NextResponse.json(
        { error: "Subject and topic are required." },
        { status: 400 }
      );
    }

    const result = await prisma.question.updateMany({
      where: {
        testId,
        id: { in: questionIds },
      },
      data: {
        subject,
        topic,
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `${result.count} questions categorized successfully.`,
    });
  } catch (error) {
    console.error("Bulk categorization error:", error);

    return NextResponse.json(
      { error: "Unable to categorize questions." },
      { status: 500 }
    );
  }
}
