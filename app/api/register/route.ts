
import { NextResponse } from "next/server";
import { randomBytes, scrypt } from "node:crypto";
import { prisma } from "../../../lib/prisma";

// Securely hash the password before saving it.
function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");

  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, password } = body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { message: "Please provide valid registration details." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || password.length < 8) {
      return NextResponse.json(
        { message: "Name, email and a password of at least 8 characters are required." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const student = await prisma.student.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
      },
    });

    return NextResponse.json(
      {
        message: "Student registered successfully!",
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "This email is already registered." },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { message: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
