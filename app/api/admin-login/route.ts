
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

    const admin = await prisma.admin.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!admin) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordCorrect = await verifyPassword(
      password,
      admin.passwordHash
    );

    if (!passwordCorrect) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

    const payload = Buffer.from(
      JSON.stringify({
        adminId: admin.id,
        expiresAt,
      })
    ).toString("base64url");

    const signature = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const sessionToken = `${payload}.${signature}`;

    const response = NextResponse.json({
      message: "Admin login successful!",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });

    response.cookies.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { message: "Admin login failed. Please try again." },
      { status: 500 }
    );
  }
}
