import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../lib/prisma";
import StudentDashboard from "./StudentDashboard";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("Invalid SESSION_SECRET configuration.");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("student_session")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 2) {
      redirect("/login");
    }

    const [payload, signature] = parts;

    const expected = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const receivedBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expected, "base64url");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      redirect("/login");
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      !Number.isSafeInteger(session.studentId) ||
      !Number.isSafeInteger(session.expiresAt) ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      redirect("/login");
    }

    const student = await prisma.student.findUnique({
      where: { id: session.studentId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!student) {
      redirect("/login");
    }

    return <StudentDashboard student={student} />;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    redirect("/login");
  }
}