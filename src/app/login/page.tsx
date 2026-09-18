"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SunMedium, Mail, Lock, AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithEmail } from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInWithEmail(trimmedEmail, password);

      if (result.error) {
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Signed in successfully! Redirecting to workspace…");
      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please try again.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
            <SunMedium className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-900">
            SolarDocs
          </span>
        </Link>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Sign in to your workspace
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your credentials to access your collaborative documents
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xs border border-slate-200/80 rounded-xl sm:px-10 space-y-5">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{successMessage}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </form>

          {/* Guest / Hackathon Flow Option */}
          <div className="pt-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400">or</span>
              </div>
            </div>

            <div className="mt-4">
              <Link href="/dashboard" className="w-full block">
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  className="w-full text-xs"
                >
                  Continue as Guest to Workspace
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 pt-1">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-indigo-600 hover:text-indigo-700 hover:underline font-semibold"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
