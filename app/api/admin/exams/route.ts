
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

export async function GET() {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json(
        { error: "Admin login required." },
        { status: 401 }
      );
    }

    const exams = await prisma.exam.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { tests: true },
        },
      },
    });

    return NextResponse.json({ success: true, exams });
  } catch (error) {
    console.error("Fetch exams error:", error);

    return NextResponse.json(
      { error: "Unable to fetch exams." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json(
        { error: "Admin login required." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        { error: "Exam name is required." },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.create({
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Exam created successfully.",
      exam,
    });
  } catch (error) {
    console.error("Create exam error:", error);

    return NextResponse.json(
      { error: "Unable to create exam." },
      { status: 500 }
    );
  }
}

// Edit an exam
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
    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (!Number.isSafeInteger(id) || id <= 0 || !name) {
      return NextResponse.json(
        { error: "Valid exam ID and exam name are required." },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Exam updated successfully.",
      exam,
    });
  } catch (error) {
    console.error("Update exam error:", error);

    return NextResponse.json(
      { error: "Unable to update exam. Please check the exam ID." },
      { status: 500 }
    );
  }
}

// Delete an exam only if it has no sets
export async function DELETE(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json(
        { error: "Admin login required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Valid exam ID is required." },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tests: true },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found." },
        { status: 404 }
      );
    }

    if (exam._count.tests > 0) {
      return NextResponse.json(
        {
          error: "This exam contains sets. Remove or reassign its sets before deleting the exam.",
        },
        { status: 400 }
      );
    }

    await prisma.exam.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Exam deleted successfully.",
    });
  } catch (error) {
    console.error("Delete exam error:", error);

    return NextResponse.json(
      { error: "Unable to delete exam." },
      { status: 500 }
    );
  }
}
