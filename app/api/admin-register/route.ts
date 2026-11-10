
import { NextResponse } from "next/server";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "../../../lib/prisma";

const scryptAsync = promisify(scrypt);

export async function POST(request: Request) {
  try {
    const secret = process.env.ADMIN_SETUP_KEY;

    if (!secret || secret.length < 16) {
      return NextResponse.json(
        { message: "Admin setup is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, email, password, setupKey } = body;

    if (
      typeof setupKey !== "string" ||
      setupKey !== secret
    ) {
      return NextResponse.json(
        { message: "Invalid setup key." },
        { status: 403 }
      );
    }

    // Allow only the first Admin account to be created.
    const adminCount = await prisma.admin.count();

    if (adminCount > 0) {
      return NextResponse.json(
        { message: "Admin registration is already closed." },
        { status: 403 }
      );
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      return NextResponse.json(
        {
          message:
            "Enter a name, email and password of at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const salt = randomBytes(16).toString("hex");

    const derivedKey = (await scryptAsync(
      password,
      salt,
      64
    )) as Buffer;

    const passwordHash = `${salt}:${derivedKey.toString("hex")}`;

    const admin = await prisma.admin.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(
      {
        message: "Admin account created successfully!",
        admin,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin registration error:", error);

    return NextResponse.json(
      { message: "Admin registration failed." },
      { status: 500 }
    );
  }
}
