"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getBrowserClientAsync } from "@/lib/auth/authHelpers";

function parseHashParams(hash: string): { access_token?: string; refresh_token?: string } {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return {
    access_token: params.get("access_token") ?? undefined,
    refresh_token: params.get("refresh_token") ?? undefined,
  };
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const code = searchParams.get("code");
      const hash = typeof window !== "undefined" ? window.location.hash : "";

      try {
        const client = await getBrowserClientAsync();

        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code);
          if (cancelled) return;
          if (error) {
            setStatus("error");
            return;
          }
        } else if (hash) {
          const { access_token, refresh_token } = parseHashParams(hash);
          if (access_token && refresh_token) {
            const { error } = await client.auth.setSession({ access_token, refresh_token });
            if (cancelled) return;
            if (error) {
              setStatus("error");
              return;
            }
          }
        }

        if (cancelled) return;
        setStatus("done");
        router.replace("/auth/login?confirmed=1");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (status === "error") {
    return (
      <div className="flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-red-600 dark:text-red-400">
          Link za potvrdu nije valjan ili je istekao.
        </p>
        <a
          href="/auth/login"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Natrag na prijavu
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4">
      <p className="text-sm text-stone-500">Potvrđujemo tvoj email…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4">
          <p className="text-sm text-stone-500">Učitavanje…</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
