"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.95h5.63c-.25 1.32-1 2.44-2.13 3.19v2.66h3.45c2.02-1.86 3.18-4.59 3.18-7.84 0-.76-.07-1.49-.2-2.19H12Z"
      />
      <path
        fill="#34A853"
        d="M6.51 14.17a7.23 7.23 0 0 1 0-4.34V7.17H3.06a12 12 0 0 0 0 9.65l3.45-2.65Z"
      />
      <path
        fill="#4A90E2"
        d="M12 4.79a6.55 6.55 0 0 1 4.63 1.8l3.46-3.46A11.94 11.94 0 0 0 12 0a11.96 11.96 0 0 0-8.94 3.91l3.45 2.65A7.14 7.14 0 0 1 12 4.79Z"
      />
      <path
        fill="#FBBC05"
        d="M12 19.2a7.14 7.14 0 0 1-4.43-1.52L4.12 20.3A11.91 11.91 0 0 0 12 24c3.2 0 5.9-1.05 7.87-2.86l-3.45-2.66A6.58 6.58 0 0 1 12 19.2Z"
      />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  async function handleGoogleSignIn() {
    setError("");
    setOauthLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (authError) {
      setError(authError.message);
      setOauthLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Link
        href="/"
        className="absolute left-4 top-4 z-20 text-sm text-[#A3A3A3] transition-colors hover:text-white"
      >
        ← Back
      </Link>

      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="flex min-h-screen flex-col justify-center bg-[#0D0D0D] px-6 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10">
              <Image
                src="/logo-dark.png"
                alt="Minutz"
                width={120}
                height={30}
                priority
                loading="eager"
                style={{ width: "auto", height: "auto" }}
              />
            </div>

            <div className="space-y-2">
              <h1 className="text-[24px] font-bold leading-tight text-white">Create your account</h1>
              <p className="text-sm text-[#A3A3A3]">
                Start recording meetings invisibly. Free forever.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-white">
                    First name
                  </label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    className={cn(
                      "h-11 border-[#2A2A2A] bg-[#1A1A1A] text-white placeholder:text-[#6B6B6B] focus-visible:border-[#FF6A00] focus-visible:ring-[#FF6A00]"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-white">
                    Last name
                  </label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    required
                    className="h-11 border-[#2A2A2A] bg-[#1A1A1A] text-white placeholder:text-[#6B6B6B] focus-visible:border-[#FF6A00] focus-visible:ring-[#FF6A00]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-white">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-11 border-[#2A2A2A] bg-[#1A1A1A] text-white placeholder:text-[#6B6B6B] focus-visible:border-[#FF6A00] focus-visible:ring-[#FF6A00]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-white">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 border-[#2A2A2A] bg-[#1A1A1A] text-white placeholder:text-[#6B6B6B] focus-visible:border-[#FF6A00] focus-visible:ring-[#FF6A00]"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-[#FF6A00] font-semibold text-white hover:bg-[#E55E00]"
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>

              <div className="flex items-center gap-3 py-2">
                <Separator className="flex-1 bg-[#2A2A2A]" />
                <span className="text-xs uppercase tracking-[0.2em] text-[#6B6B6B]">
                  or continue with
                </span>
                <Separator className="flex-1 bg-[#2A2A2A]" />
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={oauthLoading}
                onClick={handleGoogleSignIn}
                className="h-11 w-full border-[#2A2A2A] bg-transparent text-white hover:bg-[#1A1A1A] hover:text-white"
              >
                <GoogleIcon />
                <span>{oauthLoading ? "Connecting..." : "Continue with Google"}</span>
              </Button>

              {error ? <p className="text-sm text-[#FF8A8A]">{error}</p> : null}

              <p className="pt-2 text-center text-sm text-[#A3A3A3]">
                Already have an account?{" "}
                <Link href="/login" className="text-[#FF6A00] transition-colors hover:text-[#E55E00]">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </section>

        <aside className="flex min-h-screen flex-col justify-between bg-[#1A1A1A] px-6 py-12 sm:px-10 lg:px-12">
          <div className="flex-1" />

          <div className="mx-auto flex w-full max-w-xl flex-col gap-10">
            <div>
              <p className="max-w-lg text-[28px] font-bold leading-[1.3] text-white">
                “Your next meeting is in 10 minutes.”
                <br />
                “Will you remember it?”
              </p>
              <div className="mt-4 h-[3px] w-12 bg-[#FF6A00]" />
            </div>

            <div className="space-y-4">
              {[
                "No bot joins your call. Ever.",
                "Summaries ready in 60 seconds.",
                "Auto-synced to Slack, Notion, HubSpot.",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm text-[#A3A3A3]">
                  <span className="mt-0.5 text-[#FF6A00]" aria-hidden="true">
                    ⚡
                  </span>
                  <p>{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl pt-12">
            <p className="text-sm text-[#A3A3A3]">Trusted by sales teams, PMs, and founders</p>
            <div className="mt-4 flex items-center gap-3">
              {["R.S", "P.M", "V.D"].map((initials) => (
                <Avatar key={initials} className="size-10 border-0 bg-[#2A2A2A]">
                  <AvatarFallback className="bg-[#2A2A2A] text-xs font-medium text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
