"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button, Input, Field, Spinner, MessageBar, MessageBarBody, MessageBarTitle } from "@fluentui/react-components";

export function SignInForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStep("otp");
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // If a non-admin user is currently logged in, sign them out first
      // so their session doesn't conflict with the admin credentials login
      if (session && (session.user as any)?.role !== "ADMIN") {
        await signOut({ redirect: false });
      }

      const result = await signIn("credentials", {
        phoneNumber,
        otp,
        redirect: false,
      });
      
      if (result?.error) {
        setError("Invalid OTP. Please try again.");
      } else {
        // Use hard navigation to avoid the Router-not-initialized error
        window.location.href = "/admin";
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="Phone Number" hint="Format: +1234567890">
            <Input 
              type="tel" 
              placeholder="+1234567890" 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)} 
              disabled={loading}
              required
            />
          </Field>
          <Button appearance="primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? <Spinner size="tiny" /> : "Send OTP"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="One-Time Password (OTP)" hint="Check your console for the mock OTP!">
            <Input 
              type="text" 
              placeholder="123456" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              disabled={loading}
              required
            />
          </Field>
          <Button appearance="primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? <Spinner size="tiny" /> : "Verify & Login"}
          </Button>
          <Button appearance="subtle" onClick={() => setStep("phone")} disabled={loading} style={{ width: "100%" }}>
            Back
          </Button>
        </form>
      )}
    </div>
  );
}
