import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session")?.value;

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [adminId, signature] = session.split(".");

    if (!adminId || !signature) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(adminId)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const resultId = Number(id);

    if (!Number.isInteger(resultId) || resultId <= 0) {
      return NextResponse.json(
        { error: "Invalid result ID" },
        { status: 400 }
      );
    }

    await prisma.examResult.delete({
      where: { id: resultId },
    });

    return NextResponse.json({
      success: true,
      message: "Exam result deleted successfully.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete exam result." },
      { status: 500 }
    );
  }
}