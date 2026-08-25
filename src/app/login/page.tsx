"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldAlert, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuth } from "@/lib/context/AuthContext";

/* ── Shared input class (theme-aware via globals.css .light rules) ── */
const INPUT_CLS =
  "w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 " +
  "bg-[var(--input-bg)] text-[var(--input-text)] " +
  "border border-[var(--input-border)] " +
  "placeholder:text-[var(--muted)] " +
  "focus:outline-none focus:ring-2 focus:ring-[#1BA8B5] focus:border-[#1BA8B5]";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/trips/new";
  const { login }    = useAuth();

  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await signIn("credentials", { redirect: false, email: cleanEmail, password });
      if (res?.ok) {
        login(cleanEmail);
        router.push(redirectTarget);
        router.refresh();
      } else {
        setError("Incorrect email or password. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };


  const handleOAuth = async (provider: "google" | "facebook") => {
    setOauthLoading(provider);
    setError(null);
    try {
      await signIn(provider, { callbackUrl: redirectTarget });
    } catch {
      setError(`${provider === "google" ? "Google" : "Facebook"} sign-in failed. Please try again.`);
      setOauthLoading(null);
    }
  };

  const anyLoading = isLoading || oauthLoading !== null;

  return (
    <div
      className="auth-card w-full max-w-md rounded-3xl p-8 sm:p-10 space-y-6 backdrop-blur-2xl"
      style={{
        background:   "var(--card)",
        border:       "1px solid var(--card-border)",
        boxShadow:    "0 32px 80px -16px rgba(0,0,0,0.35), 0 0 0 1px rgba(27,168,181,0.08) inset",
      }}
    >
      {/* Notice banner */}
      {redirectTarget.includes("/trips/new") && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-medium"
          style={{
            background:  "rgba(27,168,181,0.10)",
            border:      "1px solid rgba(27,168,181,0.30)",
            color:       "#1BA8B5",
          }}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Please sign in to create a new trip itinerary.</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs font-medium"
          style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)", color: "#f87171" }}
        >
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="relative w-16 h-16 rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 0 28px -4px rgba(27,168,181,0.60)" }}
        >
          <Image src="/logo.png" alt="Travel Planner Logo" fill className="object-cover" priority />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            Welcome back
          </h1>
          <p className="text-xs mt-1 font-medium" style={{ color: "var(--muted)" }}>
            Sign in to your Travel Planner account
          </p>
        </div>
      </div>

      {/* ── OAuth buttons ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button" id="login-google"
          onClick={() => handleOAuth("google")}
          disabled={anyLoading}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background:  "var(--card)",
            border:      "1.5px solid var(--card-border)",
            color:       "var(--foreground)",
            boxShadow:   "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {oauthLoading === "google" ? (
            <span className="w-4 h-4 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
          ) : <GoogleIcon />}
          <span>Google</span>
        </button>

        <button
          type="button" id="login-facebook"
          onClick={() => handleOAuth("facebook")}
          disabled={anyLoading}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background:  "rgba(24,119,242,0.08)",
            border:      "1.5px solid rgba(24,119,242,0.30)",
            color:       "#1877F2",
          }}
        >
          {oauthLoading === "facebook" ? (
            <span className="w-4 h-4 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
          ) : <FacebookIcon />}
          <span>Facebook</span>
        </button>
      </div>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          or continue with email
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
      </div>

      {/* ── Email / Password form ─────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#1BA8B5" }} />
            <input
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="traveler@example.com"
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#1BA8B5" }} />
            <input
              type={showPassword ? "text" : "password"} required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={INPUT_CLS + " pr-10"}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "var(--muted)" }}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked
              className="rounded accent-[#1BA8B5] cursor-pointer" />
            <span>Remember me</span>
          </label>
          <a href="#" className="font-bold hover:underline transition-colors" style={{ color: "#1BA8B5" }}>
            Forgot password?
          </a>
        </div>

        {/* Submit */}
        <button
          type="submit" id="login-submit"
          disabled={anyLoading}
          className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2
                     transition-all transform hover:scale-[1.02] active:scale-95 border border-white/20
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
          style={{
            background: "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 55%, #C8872A 100%)",
            boxShadow:  "0 8px 24px -6px rgba(27,168,181,0.50)",
            color:      "#ffffff",
          }}
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : null}
          <span style={{ color: "#ffffff" }}>{isLoading ? "Signing in…" : "Sign In & Continue"}</span>
          {!isLoading && <ArrowRight className="w-4 h-4" style={{ color: "#ffffff" }} />}
        </button>
      </form>

      {/* Register link */}
      <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
        Don&apos;t have an account?{" "}
        <Link href={`/register?redirect=${encodeURIComponent(redirectTarget)}`}
          className="font-bold hover:underline transition-colors" style={{ color: "#1BA8B5" }}>
          Create account →
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-16">
      <Suspense fallback={
        <div className="w-10 h-10 border-2 border-[#1BA8B5] border-t-transparent rounded-full animate-spin" />
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
