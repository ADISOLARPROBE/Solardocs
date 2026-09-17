import Link from "next/link";
import {
  SunMedium,
  ArrowRight,
  Sparkles,
  FileText,
  Users,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation Header */}
      <header className="h-16 border-b border-slate-200/80 bg-white/80 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <SunMedium className="w-4 h-4" />
            </div>
            <span className="font-semibold text-base tracking-tight text-slate-900">
              SolarDocs
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
              Workspace
            </Link>
            <Link href="/editor/demo-doc" className="hover:text-indigo-600 transition-colors">
              Live Editor
            </Link>
            <Link href="/settings" className="hover:text-indigo-600 transition-colors">
              Settings
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="gap-1.5">
                <span>Go to Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          {/* Release Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Local-First CRDT Real-Time Collaboration</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            Thoughtful documentation for modern teams.
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            A distraction-free rich-text editor with instant peer-to-peer Yjs state synchronization, TipTap extensible formatting, and clean typography.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/editor/demo-doc" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2">
                <FileText className="w-4 h-4" />
                <span>Open Live Demo Editor</span>
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
                <span>Browse Documents</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Button>
            </Link>
          </div>

          {/* Preview Sheet Mockup */}
          <div className="mt-14 text-left mx-auto max-w-3xl bg-white rounded-lg border border-slate-200/80 shadow-2xs p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="ml-2 font-mono text-[11px] text-slate-500">solardocs.app/editor/demo-doc</span>
              </div>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200/60 font-medium">
                Synced
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              SolarDocs Architecture Overview
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
              SolarDocs is designed to keep your thoughts clear and your team in sync. By decoupling user input from network round-trips via Yjs conflict-free replicated data types, edits feel instantaneous.
            </p>
            <div className="p-3 bg-slate-50 border-l-2 border-indigo-600 rounded-r text-xs text-slate-600 italic">
              “The most fluid documentation experience we have ever deployed across engineering.”
            </div>
          </div>
        </section>

        {/* Value Pillars */}
        <section className="border-t border-slate-200/80 bg-white py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Designed for speed, clarity, and precision
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1.5">
                Built from the ground up with modern standards and zero visual bloat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors shadow-2xs">
                <div className="w-9 h-9 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3.5">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                  TipTap Rich Text
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Headings, formatted lists, underline, bold, and italic styles with instant visual feedback and keyboard-first ergonomics.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors shadow-2xs">
                <div className="w-9 h-9 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3.5">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                  Real-Time Yjs CRDT
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Multi-user edits converge cleanly via WebSocket rooms without last-write-wins lockouts or corrupted document histories.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors shadow-2xs">
                <div className="w-9 h-9 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                  Restrained Aesthetics
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Calm neutral canvases, crisp typography, and intentional indigo accents. No neon, glass effects, or distracting animations.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <SunMedium className="w-4 h-4 text-indigo-600" />
            <span>SolarDocs</span>
            <span className="text-slate-400 font-normal">© 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
              Workspace
            </Link>
            <Link href="/editor/demo-doc" className="hover:text-indigo-600 transition-colors">
              Editor
            </Link>
            <Link href="/settings" className="hover:text-indigo-600 transition-colors">
              Settings
            </Link>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
