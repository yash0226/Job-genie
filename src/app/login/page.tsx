"use client";

import { supabase } from "@/lib/supabase";
import { useMemo } from "react";

export default function LoginPage() {
  const returnTo = useMemo(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const rt = sp.get('returnTo') || ''
      // only allow same-site paths for safety
      return rt.startsWith('/') ? rt : ''
    } catch {
      return ''
    }
  }, [])

  const signInWithGithub = async () => {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const cb = returnTo ? `${base}/auth/callback?returnTo=${encodeURIComponent(returnTo)}` : `${base}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: cb,
      },
    });
    if (error) alert(error.message);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 text-gray-100">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold text-white">Login</h1>
        <p className="mt-2 text-sm text-gray-300">
          Sign in to continue. This window will close automatically after login.
        </p>
        <button
          onClick={signInWithGithub}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm"
        >
          Continue with GitHub
        </button>
      </div>
    </main>
  );
}
