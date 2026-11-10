
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Verify session secret
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // 2. Check admin cookie
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

    // 3. Verify signature
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

    // 4. Verify session expiry
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

    // 5. Confirm admin exists
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

    // 6. Fetch exam results
    const results = await prisma.examResult.findMany({
      where: {
        studentId: { not: null },
      },
      select: {
        id: true,
        score: true,
        totalQuestions: true,
        createdAt: true,
        student: {
          select: {
            name: true,
            email: true,
          },
        },
        test: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error("Admin results error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve exam results." },
      { status: 500 }
    );
  }
}
