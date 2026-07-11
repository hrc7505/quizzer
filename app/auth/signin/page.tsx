"use client";

import { SignInForm } from "@/components/ui/SignInForm";
import { Card, CardHeader, CardPreview, Text, makeStyles } from "@fluentui/react-components";

export default function SignInPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '100vh' }}>
      <Card style={{ width: '400px', maxWidth: '100%', padding: '24px' }}>
        <CardHeader
          header={
            <Text weight="semibold" size={600}>
              Admin Login
            </Text>
          }
          description={
            <Text size={300}>
              Enter your phone number to receive an OTP
            </Text>
          }
        />
        <SignInForm />
      </Card>
    </div>
  );
}
