"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

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
    <Card className="w-full max-w-md p-6 sm:p-8 bg-card shadow-lg border border-border/80 rounded-2xl">
      <CardHeader className="pb-4 border-b border-border/50 flex flex-col gap-1.5 p-0">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl font-bold tracking-tight">Sign In to Quizzer</CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground leading-relaxed">
          Sign in to start playing quizzes and save your progress.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 px-0 pb-0 flex flex-col gap-5">
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {/* Google Sign In Button */}
        <Button 
          variant="primary" 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-11 text-sm font-semibold shadow-xs"
        >
          {loading ? <Spinner size="sm" className="text-primary-foreground" /> : "Sign In with Google"}
        </Button>

        <div className="flex items-center gap-4 py-1 select-none">
          <div className="flex-1 h-px bg-border/80" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">or use Dev Login</span>
          <div className="flex-1 h-px bg-border/80" />
        </div>

        {/* Dev Login Form */}
        <form onSubmit={handleDevLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground/90">Developer Email</label>
            <Input 
              type="email" 
              placeholder="user@quizzer.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              error={!!error}
              required
            />
            <span className="text-xs text-muted-foreground/70">For local testing. e.g. user@quizzer.com</span>
          </div>
          
          <Button variant="outline" type="submit" disabled={loading} className="w-full h-10 font-semibold mt-1">
            {loading ? <Spinner size="sm" /> : "Sign In with Credentials"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Main user sign-in route wrapping client hooks in Suspense.
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 transition-colors duration-200">
      <Suspense fallback={<Spinner size="lg" />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
