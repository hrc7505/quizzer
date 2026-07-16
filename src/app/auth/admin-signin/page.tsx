"use client";

import { SignInForm } from "@/components/forms/SignInForm";
import { Card, CardHeader, Text, MessageBar, MessageBarBody } from "@fluentui/react-components";
import { useSession } from "next-auth/react";
import { SessionUser } from "@/lib/auth";
import { useAuthPageStyles } from "@/components/forms/styles/useAuthPageStyles";

/**
 * Admin Login Page. Uses Phone/OTP credentials flow and features a dark background.
 * Separate from the public Google OAuth login — handles admin-only access.
 */
export default function AdminSignInPage() {
  const styles = useAuthPageStyles();
  const { data: session } = useSession();
  const isUserLoggedIn = session && (session.user as SessionUser)?.role !== "ADMIN";

  return (
    <div className={`${styles.pageRoot} ${styles.pageRootDark}`}>
      <Card className={`${styles.card} ${styles.cardDark}`}>
        <CardHeader
          header={
            <Text weight="bold" size={600}>
              Admin Portal
            </Text>
          }
          description={
            <Text size={300} className={styles.descriptionText}>
              Enter your registered phone number to receive an OTP.
            </Text>
          }
        />
        {isUserLoggedIn && (
          <MessageBar intent="warning" className={styles.adminWarning}>
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
