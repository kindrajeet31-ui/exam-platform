
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { message: "Server session configuration error." },
        { status: 500 }
      );
    }

    // Read the login cookie.
    const cookieStore = await cookies();
    const token = cookieStore.get("student_session")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Please log in first." },
        { status: 401 }
      );
    }

    // Separate the session payload and signature.
    const parts = token.split(".");

    if (parts.length !== 2) {
      return NextResponse.json(
        { message: "Invalid session." },
        { status: 401 }
      );
    }

    const [payload, signature] = parts;

    // Verify the session signature.
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
        { message: "Invalid session." },
        { status: 401 }
      );
    }

    // Read the session information.
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      !Number.isSafeInteger(session.studentId) ||
      !Number.isSafeInteger(session.expiresAt) ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return NextResponse.json(
        { message: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    // Find the logged-in student.
    const student = await prisma.student.findUnique({
      where: { id: session.studentId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student not found." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { student },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Student profile error:", error);

    return NextResponse.json(
      { message: "Could not load student profile." },
      { status: 500 }
    );
  }
}
