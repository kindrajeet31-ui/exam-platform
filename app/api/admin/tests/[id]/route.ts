
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    return false;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token) return false;

  const [payload, signature] = token.split(".");

  if (!payload || !signature) return false;

  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return false;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      !session.adminId ||
      !session.expiresAt ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return false;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: Number(session.adminId) },
    });

    return Boolean(admin);
  } catch {
    return false;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verify admin
    if (!(await verifyAdmin())) {
      return NextResponse.json(
        { error: "Admin login required." },
        { status: 401 }
      );
    }

    // 2. Get test ID
    const { id } = await params;
    const testId = Number(id);

    if (!Number.isInteger(testId) || testId <= 0) {
      return NextResponse.json(
        { error: "Invalid test ID." },
        { status: 400 }
      );
    }

    // 3. Read information
    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const duration = Number(body.duration);
    const scheduleData: {
  availableFrom?: Date | null;
  isPublished?: boolean;
} = {};

if ("availableFrom" in body) {
  const date =
    typeof body.availableFrom === "string" && body.availableFrom.trim()
      ? new Date(body.availableFrom)
      : null;

  if (date && Number.isNaN(date.getTime())) {
    return NextResponse.json(
      { error: "Invalid release date and time." },
      { status: 400 }
    );
  }

  scheduleData.availableFrom = date;
}

if ("isPublished" in body) {
  if (typeof body.isPublished !== "boolean") {
    return NextResponse.json(
      { error: "Invalid publication status." },
      { status: 400 }
    );
  }

  scheduleData.isPublished = body.isPublished;
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

    // 4. Check existing test
    const existingTest = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!existingTest) {
      return NextResponse.json(
        { error: "Test not found." },
        { status: 404 }
      );
    }

    // 5. Update test
    const updatedTest = await prisma.test.update({
      where: { id: testId },
data: {
  title,
  description: description || null,
  duration,
  ...scheduleData,
},
    });

    return NextResponse.json({
      success: true,
      message: "Test updated successfully.",
      test: updatedTest,
    });
  } catch (error) {
    console.error("Update test error:", error);

    return NextResponse.json(
      { error: "Unable to update test." },
      { status: 500 }
    );
  }
}
