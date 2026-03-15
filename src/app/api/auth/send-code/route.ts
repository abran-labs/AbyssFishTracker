import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate 6-digit OTP
    const code = randomInt(100000, 999999).toString();

    // Invalidate any existing unused codes for this email
    await prisma.otpCode.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    // Store OTP with 10-minute expiry
    await prisma.otpCode.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send email via Resend
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: normalizedEmail,
      subject: "Your Abyss Fish Tracker login code",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
          <h2 style="margin-bottom: 8px;">Your login code</h2>
          <p style="color: #666; margin-bottom: 24px;">Enter this code to sign in to Abyss Fish Tracker:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f4f4f5; border-radius: 8px; margin-bottom: 24px;">
            ${code}
          </div>
          <p style="color: #999; font-size: 14px;">This code expires in 10 minutes.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
