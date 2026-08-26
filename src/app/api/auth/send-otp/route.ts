import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/services/email.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phoneNumber = (body?.phoneNumber || "").toString().trim();

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

    // Dispatch OTP to Admin Email if configured
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || "hrc7505@gmail.com";
    if (adminEmail && process.env.RESEND_API_KEY) {
      await sendOtpEmail({
        to: adminEmail,
        otp,
        phoneNumber,
      }).catch((e) => console.error("[EMAIL] OTP email error:", e));
    }

    if (process.env.NODE_ENV === "production") {
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
