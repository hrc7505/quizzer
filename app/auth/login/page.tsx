"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, Text, Button, Input, Field, Spinner, MessageBar, MessageBarBody } from "@fluentui/react-components";
import { Sparkle24Regular } from "@fluentui/react-icons";

/**
 * User login page contents that accesses query parameters safely within a Suspense block.
 */
function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setError("Sign in failed. Check credentials.");
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ width: '400px', maxWidth: '100%', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: '12px' }}>
      <CardHeader
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkle24Regular style={{ color: '#0078d4' }} />
            <Text weight="bold" size={600}>
              Sign In to Quizzer
            </Text>
          </div>
        }
        description={
          <Text size={300} style={{ color: '#64748b' }}>
            Sign in to start playing quizzes and save your progress.
          </Text>
        }
      />

      {error && (
        <MessageBar intent="error" style={{ marginTop: '16px' }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
        {/* Google Sign In Button */}
        <Button 
          appearance="primary" 
          size="large" 
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{ 
            backgroundColor: '#0078d4', 
            color: 'white', 
            fontWeight: '600', 
            height: '44px',
            borderRadius: '6px'
          }}
        >
          {loading ? <Spinner size="tiny" /> : "Sign In with Google"}
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <Text size={200} style={{ padding: '0 8px', color: '#94a3b8' }}>or use Dev Login</Text>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        {/* Dev Login Form */}
        <form onSubmit={handleDevLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="Developer Email" hint="For local testing. e.g. user@quizzer.com">
            <Input 
              type="email" 
              placeholder="user@quizzer.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              style={{ height: '36px' }}
            />
          </Field>
          <Button appearance="outline" type="submit" disabled={loading} style={{ height: '36px' }}>
            {loading ? <Spinner size="tiny" /> : "Sign In with Credentials"}
          </Button>
        </form>
      </div>
    </Card>
  );
}

/**
 * Main user sign-in route wrapping client hooks in Suspense.
 */
export default function LoginPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Suspense fallback={<Spinner size="large" label="Loading sign in..." />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
