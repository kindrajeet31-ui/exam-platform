
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;

  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return false;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      !Number.isSafeInteger(session.adminId) ||
      !Number.isSafeInteger(session.expiresAt) ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return false;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: { id: true },
    });

    return Boolean(admin);
  } catch {
    return false;
  }
}

// Get all question reports
export async function GET() {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json(
        { error: "Admin login required." },
        { status: 401 }
      );
    }

    const reports = await prisma.questionReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        question: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Fetch question reports error:", error);

    return NextResponse.json(
      { error: "Unable to fetch question reports." },
      { status: 500 }
    );
  }
}

// Update report status
export async function PATCH(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json(
        { error: "Admin login required." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = Number(body.id);
    const status =
      typeof body.status === "string" ? body.status : "";

    const allowedStatuses = [
      "PENDING",
      "REVIEWED",
      "RESOLVED",
    ];

    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        { error: "Valid report ID and status are required." },
        { status: 400 }
      );
    }

    const report = await prisma.questionReport.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      message: "Report status updated successfully.",
      report,
    });
  } catch (error) {
    console.error("Update question report error:", error);

    return NextResponse.json(
      { error: "Unable to update report status." },
      { status: 500 }
    );
  }
}
