import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Generate a 6 digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Clear old tokens for this phone number
    await prisma.verificationToken.deleteMany({
      where: { identifier: phoneNumber }
    });

    // Create new token
    await prisma.verificationToken.create({
      data: {
        identifier: phoneNumber,
        token: otp,
        expires
      }
    });

    if (process.env.NODE_ENV === "production") {
      // TODO: Replace with real SMS provider (e.g., Twilio)
      console.log(`[PRODUCTION MOCK] OTP for ${phoneNumber} is ${otp}`);
    } else {
      console.log(`[LOCAL DEV] OTP for ${phoneNumber} is ${otp}`);
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
