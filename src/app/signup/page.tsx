import Link from "next/link";
import { SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
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
          Create your account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Start collaborating on real-time documents today
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xs border border-slate-200/80 rounded-lg sm:px-10">
          <form className="space-y-4" action="/dashboard">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Alex Mercer"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 shadow-2xs"
              />
            </div>

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
                placeholder="alex@company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 shadow-2xs"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Create a strong password"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 shadow-2xs"
              />
            </div>

            <Button variant="primary" size="md" className="w-full mt-2">
              Get Started
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
