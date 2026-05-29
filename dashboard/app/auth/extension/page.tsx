"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase";

type AuthUser = {
  email: string;
  id: string;
  token: string;
};

export default function ExtensionAuthPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    const syncAuth = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.email || !session?.user?.id || !session.access_token) {
        setError("No active session found. Please return to login and try again.");
        setLoading(false);
        return;
      }

      const payload: AuthUser = {
        email: session.user.email,
        id: session.user.id,
        token: session.access_token,
      };

      setUser(payload);
      setLoading(false);

      window.dispatchEvent(new CustomEvent("minutz:set-user", { detail: payload }));
      document.dispatchEvent(new CustomEvent("minutz:set-user", { detail: payload }));

      window.opener?.postMessage(
        {
          type: "MINUTZ_AUTH",
          user: payload,
        },
        "*"
      );

      closeTimer = setTimeout(() => {
        window.close();
      }, 2000);
    };

    syncAuth().catch(() => {
      setError("Unable to confirm your session. Please return to login and try again.");
      setLoading(false);
    });

    return () => {
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-sm rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-6 py-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        {loading ? (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]">
              <span className="text-2xl leading-none">✓</span>
            </div>
            <h1 className="text-lg font-semibold text-white">Checking your sign-in...</h1>
            <p className="mt-2 text-sm text-[#A3A3A3]">Return to extension</p>
          </>
        ) : error ? (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]">
              <span className="text-2xl leading-none">!</span>
            </div>
            <h1 className="text-lg font-semibold text-white">Could not verify session</h1>
            <p className="mt-2 text-sm text-[#A3A3A3]">{error}</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]">
              <span className="text-2xl leading-none">✓</span>
            </div>
            <h1 className="text-lg font-semibold text-white">You're signed in as {user?.email}</h1>
            <p className="mt-2 text-sm text-[#A3A3A3]">Return to extension</p>
          </>
        )}
      </section>
    </main>
  );
}
