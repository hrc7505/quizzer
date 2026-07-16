"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, Text, Button, Input, Field, Spinner, MessageBar, MessageBarBody } from "@fluentui/react-components";
import { Sparkle24Regular } from "@/design-system/icons/Icons";
import { useAuthPageStyles } from "@/components/forms/styles/useAuthPageStyles";

/**
 * User login page contents that accesses query parameters safely within a Suspense block.
 */
function LoginContent() {
  const styles = useAuthPageStyles();
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
    <Card className={`${styles.card} ${styles.cardLight}`}>
      <CardHeader
        header={
          <div className={styles.cardHeaderRow}>
            <Sparkle24Regular className={styles.iconColorPrimary} />
            <Text weight="bold" size={600}>
              Sign In to Quizzer
            </Text>
          </div>
        }
        description={
          <Text size={300} className={styles.descriptionText}>
            Sign in to start playing quizzes and save your progress.
          </Text>
        }
      />

      {error && (
        <MessageBar intent="error" className={styles.errorBar}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.formRow}>
        {/* Google Sign In Button */}
        <Button 
          appearance="primary" 
          size="large" 
          onClick={handleGoogleLogin}
          disabled={loading}
          className={styles.googleButton}
        >
          {loading ? <Spinner size="tiny" /> : "Sign In with Google"}
        </Button>

        <div className={styles.dividerRow}>
          <div className={styles.dividerLine} />
          <Text size={200} className={styles.dividerText}>or use Dev Login</Text>
          <div className={styles.dividerLine} />
        </div>

        {/* Dev Login Form */}
        <form onSubmit={handleDevLogin} className={styles.devForm}>
          <Field label="Developer Email" hint="For local testing. e.g. user@quizzer.com">
            <Input 
              type="email" 
              placeholder="user@quizzer.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className={styles.inputHeight}
            />
          </Field>
          <Button appearance="outline" type="submit" disabled={loading} className={styles.outlineButton}>
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
  const styles = useAuthPageStyles();
  return (
    <div className={`${styles.pageRoot} ${styles.pageRootLight}`}>
      <Suspense fallback={<Spinner size="large" label="Loading sign in..." />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
