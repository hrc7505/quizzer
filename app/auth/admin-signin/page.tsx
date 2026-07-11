"use client";

import { SignInForm } from "@/components/ui/SignInForm";
import { Card, CardHeader, Text } from "@fluentui/react-components";

/**
 * Admin Login Page. Uses Phone/OTP credentials flow and features a dark background.
 */
export default function AdminSignInPage() {
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
        <SignInForm />
      </Card>
    </div>
  );
}
