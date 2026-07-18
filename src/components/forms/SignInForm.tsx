"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { isAdmin } from "@/lib/session";

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
    } catch {
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
      // so their session isn't conflict with the admin credentials login
      if (session && !isAdmin(session)) {
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
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground/90">Phone Number</label>
            <Input 
              type="tel" 
              placeholder="+1234567890" 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)} 
              disabled={loading}
              error={!!error}
              required
            />
            <span className="text-xs text-muted-foreground/70">Format: +1234567890</span>
          </div>
          
          <Button variant="primary" type="submit" disabled={loading} className="w-full mt-2 h-10 font-semibold gap-2">
            {loading ? <Spinner size="sm" className="text-primary-foreground" /> : "Send OTP"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground/90">One-Time Password (OTP)</label>
            <Input 
              type="text" 
              placeholder="123456" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              disabled={loading}
              error={!!error}
              required
            />
            <span className="text-xs text-muted-foreground/75">Check your terminal or browser console for the mock OTP!</span>
          </div>
          
          <div className="flex flex-col gap-2 mt-2">
            <Button variant="primary" type="submit" disabled={loading} className="w-full h-10 font-semibold gap-2">
              {loading ? <Spinner size="sm" className="text-primary-foreground" /> : "Verify & Login"}
            </Button>
            
            <Button variant="ghost" onClick={() => setStep("phone")} disabled={loading} className="w-full h-10">
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
export default SignInForm;
