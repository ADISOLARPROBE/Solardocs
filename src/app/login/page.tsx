import Link from "next/link";
import { SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <SunMedium className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-900">
            SolarDocs
          </span>
        </Link>
        <h2 className="text-xl font-bold text-slate-900">
          Sign in to your workspace
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your credentials to access your collaborative documents
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xs border border-slate-200/80 rounded-lg sm:px-10">
          <form className="space-y-4" action="/dashboard">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Work Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue="alex@solardocs.dev"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 shadow-2xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-700"
                >
                  Password
                </label>
                <a href="#" className="text-xs text-indigo-600 hover:underline">
                  Forgot?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                defaultValue="••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 shadow-2xs"
              />
            </div>

            <Button variant="primary" size="md" className="w-full mt-2">
              Sign In
            </Button>
          </form>

          <div className="mt-6">
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
                <Button variant="secondary" size="md" className="w-full text-xs">
                  Continue as Guest to Workspace
                </Button>
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-indigo-600 hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
