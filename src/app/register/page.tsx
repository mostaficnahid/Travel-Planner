"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import {
  Eye, EyeOff, Lock, Mail, User as UserIcon,
  ArrowRight, ShieldAlert, CheckCircle2, XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const INPUT_CLS =
  "w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 " +
  "bg-[var(--input-bg)] text-[var(--input-text)] " +
  "border border-[var(--input-border)] " +
  "placeholder:text-[var(--muted)] " +
  "focus:outline-none focus:ring-2 focus:ring-[#1BA8B5] focus:border-[#1BA8B5]";

/* ── Password strength bar ───────────────────────────────────────────────── */
function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters",    ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number",           ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const barColor = ["bg-red-500", "bg-amber-500", "bg-emerald-500"][score - 1] ?? "bg-slate-700";
  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? barColor : "bg-slate-700"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map((c) => (
          <span key={c.label}
            className={`text-[10px] flex items-center gap-1 transition-colors ${c.ok ? "text-emerald-400" : ""}`}
            style={{ color: c.ok ? "#10b981" : "var(--muted)" }}>
            {c.ok
              ? <CheckCircle2 className="w-3 h-3" />
              : <XCircle className="w-3 h-3" />}
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Google SVG ─────────────────────────────────────────────────────────── */
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

/* ── Register form ───────────────────────────────────────────────────────── */
function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/trips/new";

  const [name, setName]               = useState("");
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
      const res  = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed. Please try again."); return; }

      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error) {
        setError("Account created! Please sign in on the login page.");
        return;
      }
      router.push(redirectTarget);
    } catch {
      setError("Network error. Please check your connection and try again.");
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
      className="auth-card w-full max-w-md rounded-3xl p-8 sm:p-10 space-y-5 backdrop-blur-2xl"
      style={{
        background:  "var(--card)",
        border:      "1px solid var(--card-border)",
        boxShadow:   "0 32px 80px -16px rgba(0,0,0,0.35), 0 0 0 1px rgba(27,168,181,0.08) inset",
      }}
    >
      {/* Notice */}
      {redirectTarget.includes("/trips/new") && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-medium"
          style={{ background: "rgba(27,168,181,0.10)", border: "1px solid rgba(27,168,181,0.30)", color: "#1BA8B5" }}>
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Create an account to start planning your trip.</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs font-medium"
          style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)", color: "#f87171" }}>
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 0 28px -4px rgba(27,168,181,0.60)" }}>
          <Image src="/logo.png" alt="Travel Planner Logo" fill className="object-cover" priority />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            Create your account
          </h1>
          <p className="text-xs mt-1 font-medium" style={{ color: "var(--muted)" }}>
            Join thousands planning trips across 196 countries
          </p>
        </div>
      </div>

      {/* OAuth */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" id="oauth-google"
          onClick={() => handleOAuth("google")} disabled={anyLoading}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          style={{ background: "var(--card)", border: "1.5px solid var(--card-border)", color: "var(--foreground)", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          {oauthLoading === "google"
            ? <span className="w-4 h-4 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
            : <GoogleIcon />}
          <span>Google</span>
        </button>

        <button type="button" id="oauth-facebook"
          onClick={() => handleOAuth("facebook")} disabled={anyLoading}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          style={{ background: "rgba(24,119,242,0.08)", border: "1.5px solid rgba(24,119,242,0.30)", color: "#1877F2" }}>
          {oauthLoading === "facebook"
            ? <span className="w-4 h-4 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
            : <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>}
          <span>Facebook</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          or register with email
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
      </div>

      {/* Credentials form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>Full Name</label>
          <div className="relative">
            <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#1BA8B5" }} />
            <input id="register-name" type="text" required value={name}
              onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan"
              className={INPUT_CLS} />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#1BA8B5" }} />
            <input id="register-email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="traveler@example.com"
              className={INPUT_CLS} />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#1BA8B5" }} />
            <input id="register-password" type={showPassword ? "text" : "password"} required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              className={INPUT_CLS + " pr-10"} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "var(--muted)" }}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrengthBar password={password} />
        </div>

        {/* ToS */}
        <div className="flex items-center gap-2.5 text-xs" style={{ color: "var(--muted)" }}>
          <input id="register-tos" type="checkbox" required className="rounded accent-[#1BA8B5] cursor-pointer w-4 h-4" />
          <label htmlFor="register-tos" className="cursor-pointer leading-snug">
            I agree to the{" "}
            <span className="font-bold" style={{ color: "#1BA8B5" }}>Terms of Service</span>
            {" & "}
            <span className="font-bold" style={{ color: "#1BA8B5" }}>Privacy Policy</span>
          </label>
        </div>

        {/* Submit */}
        <button id="register-submit" type="submit" disabled={anyLoading}
          className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2
                     transition-all transform hover:scale-[1.02] active:scale-95 border border-white/20
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
          style={{
            background: "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 55%, #C8872A 100%)",
            boxShadow:  "0 8px 24px -6px rgba(27,168,181,0.50)",
            color:      "#ffffff",
          }}>
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : null}
          <span style={{ color: "#ffffff" }}>{isLoading ? "Creating Account…" : "Create Account & Continue"}</span>
          {!isLoading && <ArrowRight className="w-4 h-4" style={{ color: "#ffffff" }} />}
        </button>
      </form>

      {/* Sign in link */}
      <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
        Already have an account?{" "}
        <Link href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
          className="font-bold hover:underline transition-colors" style={{ color: "#1BA8B5" }}>
          Sign in →
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-16">
      <Suspense fallback={
        <div className="w-10 h-10 border-2 border-[#1BA8B5] border-t-transparent rounded-full animate-spin" />
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
