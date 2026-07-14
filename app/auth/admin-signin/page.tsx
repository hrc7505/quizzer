"use client";

import { SignInForm } from "@/components/ui/SignInForm";
import { Card, CardHeader, Text, MessageBar, MessageBarBody } from "@fluentui/react-components";
import { useSession } from "next-auth/react";
import { SessionUser } from "@/lib/auth";

/**
 * Admin Login Page. Uses Phone/OTP credentials flow and features a dark background.
 * Separate from the public Google OAuth login — handles admin-only access.
 */
export default function AdminSignInPage() {
  const { data: session } = useSession();
  const isUserLoggedIn = session && (session.user as SessionUser)?.role !== "ADMIN";

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <Card style={{ width: '400px', maxWidth: '100%', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.24)', borderRadius: '12px' }}>
        <CardHeader
          header={
            <Text weight="bold" size={600}>
              Admin Portal
            </Text>
          }
          description={
            <Text size={300} style={{ color: '#64748b' }}>
              Enter your registered phone number to receive an OTP.
            </Text>
          }
        />
        {isUserLoggedIn && (
          <MessageBar intent="warning" style={{ marginTop: '12px', borderRadius: '8px' }}>
            <MessageBarBody>
              You are currently signed in as a user. Signing in as admin will sign you out of your current session.
            </MessageBarBody>
          </MessageBar>
        )}
        <SignInForm />
      </Card>
    </div>
  );
}
