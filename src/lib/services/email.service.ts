/**
 * Email Service for Quizzer.
 * Handles transactional email delivery for OTP verification, admin alerts, and notifications.
 * Supports Resend (free 3,000 emails/month) via REST API without requiring external dependencies.
 */

export interface SendOtpEmailParams {
  /** The destination email address where the OTP should be delivered. */
  to: string;
  /** The 6-digit one-time password code. */
  otp: string;
  /** The phone number associated with the admin login request. */
  phoneNumber: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends an OTP email to the administrator using Resend API or SMTP fallback.
 *
 * @param params Email parameters including destination, OTP, and phone number.
 * @returns Result object indicating success or failure.
 */
export async function sendOtpEmail({
  to,
  otp,
  phoneNumber,
}: SendOtpEmailParams): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "Quizzer Security <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[EMAIL] RESEND_API_KEY is not configured. Skipping email dispatch.");
    return {
      success: false,
      error: "RESEND_API_KEY is not configured in environment variables.",
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; }
          .card { max-width: 480px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 8px 0; }
          .subtitle { font-size: 14px; color: #94a3b8; margin: 0; }
          .otp-box { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin: 0; font-family: monospace; }
          .info { font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
          .footer { font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 16px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 class="title">🔐 Admin Sign-In Verification</h1>
            <p class="subtitle">Quizzer Administrative Portal</p>
          </div>
          <p class="info">
            An admin login attempt was initiated for phone number <strong>${phoneNumber}</strong>. Use the verification code below to complete your sign-in.
          </p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p class="info">
            ⏱️ This code is valid for <strong>10 minutes</strong> and can only be used once. If you did not request this login, please ignore this email.
          </p>
          <div class="footer">
            Quizzer System Notification • Automated Security Message
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: `Your Admin Verification Code: ${otp}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[EMAIL] Resend API error:", data);
      return { success: false, error: data.message || "Failed to send email via Resend" };
    }

    console.log(`[EMAIL] OTP email sent successfully to ${to}. Message ID: ${data.id}`);
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error("[EMAIL] Network error while sending OTP email:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}
