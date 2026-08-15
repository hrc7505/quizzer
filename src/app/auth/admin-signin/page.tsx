"use client";

import { useSession } from "next-auth/react";

import { SignInForm } from "@/components/forms/SignInForm";
import { isAdmin } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

/**
 * Admin Login Page. Uses Phone/OTP credentials flow and features a dark background.
 * Separate from the public Google OAuth login — handles admin-only access.
 */
export default function AdminSignInPage() {
  const { data: session } = useSession();
  const isUserLoggedIn = session && !isAdmin(session);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4 sm:p-6 transition-colors duration-200">
      <Card className="w-full max-w-md p-6 sm:p-8 bg-card border-border rounded-2xl shadow-xl">
        <CardHeader className="pb-4 border-b border-border/60 flex flex-col gap-1.5 p-0">
          <CardTitle className="text-xl font-bold tracking-tight">Admin Portal</CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-relaxed">
            Enter your registered phone number to receive an OTP.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 px-0 pb-0 flex flex-col gap-5">
          {isUserLoggedIn && (
            <div className="rounded-lg border border-warning/20 bg-warning/10 p-3.5 text-xs font-medium text-warning">
              You are currently signed in as a user. Signing in as admin will sign you out of your current session.
            </div>
          )}
          
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  );
}
