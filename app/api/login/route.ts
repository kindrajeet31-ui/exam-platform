
import { NextResponse } from "next/server";
import {
  scrypt,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { prisma } from "../../../lib/prisma";

function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, key] = storedHash.split(":");

  if (!salt || !key) {
    return Promise.resolve(false);
  }

  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      const savedKey = Buffer.from(key, "hex");

      if (savedKey.length !== derivedKey.length) {
        resolve(false);
        return;
      }

      resolve(timingSafeEqual(savedKey, derivedKey));
    });
  });
}

export async function POST(request: Request) {
  try {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { message: "Server session configuration is missing or too short." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordCorrect = await verifyPassword(
      password,
      student.passwordHash
    );

    if (!passwordCorrect) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Create a session that expires in 7 days.
    const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

    const payload = Buffer.from(
      JSON.stringify({
        studentId: student.id,
        expiresAt,
      })
    ).toString("base64url");

    const signature = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const sessionToken = `${payload}.${signature}`;

    const response = NextResponse.json({
      message: "Login successful!",
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
    });

    response.cookies.set("student_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { message: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
