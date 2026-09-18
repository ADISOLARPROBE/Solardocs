"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SunMedium,
  ArrowLeft,
  User,
  Wifi,
  Keyboard,
  Check,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCollaborationWebSocketUrl } from "@/lib/collab-config";
import { getOrCreateLocalUser, SessionUser } from "@/lib/collaboration-user";
import { signOutUser } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "collaboration" | "shortcuts">("general");
  const [saved, setSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setCurrentUser(getOrCreateLocalUser());
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/login");
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Workspace</span>
          </Link>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <SunMedium className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm text-slate-900">Settings</span>
          </div>
        </div>

        <Button variant="primary" size="sm" onClick={handleSave} className="gap-1.5">
          {saved ? <Check className="w-3.5 h-3.5" /> : null}
          <span>{saved ? "Saved" : "Save Changes"}</span>
        </Button>
      </header>

      {/* Main Settings Body */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Navigation */}
        <aside className="w-full md:w-52 shrink-0 space-y-1 select-none">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === "general"
                ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/60 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Account</span>
          </button>

          <button
            onClick={() => setActiveTab("collaboration")}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === "collaboration"
                ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/60 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Collaboration & Sync</span>
          </button>

          <button
            onClick={() => setActiveTab("shortcuts")}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === "shortcuts"
                ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/60 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Keyboard Shortcuts</span>
          </button>
        </aside>

        {/* Setting Panels */}
        <main className="flex-1 min-w-0">
          {activeTab === "general" && (
            <div className="bg-white border border-slate-200/80 rounded-lg p-6 space-y-6 shadow-2xs">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Profile Information</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your display identity across collaborative document rooms.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 max-w-lg">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Alex Mercer"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue="alex@solardocs.dev"
                    readOnly
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">Session & Sign Out</h4>
                    <p className="text-[11px] text-slate-400">Sign out of your active workspace session and return to login</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "collaboration" && (
            <div className="bg-white border border-slate-200/80 rounded-lg p-6 space-y-6 shadow-2xs">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Sync & WebSocket Configuration</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure local and remote Yjs synchronization endpoints.
                </p>
              </div>

              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    WebSocket Collaboration Server URL
                  </label>
                  <input
                    type="text"
                    defaultValue={getCollaborationWebSocketUrl()}
                    readOnly
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Routes through <code className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200/80">/yjs</code> on the same domain (<code className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200/80">ws://</code> locally, <code className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200/80">wss://</code> on Railway).
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-800 block">
                      Conflict-Free Replicated Data Types
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Automatic vector clock convergence enabled
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "shortcuts" && (
            <div className="bg-white border border-slate-200/80 rounded-lg p-6 space-y-6 shadow-2xs">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Editor Shortcuts</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quick key combinations supported in the TipTap editor.
                </p>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-700">Bold text</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono rounded text-[11px] border border-slate-200">
                    Ctrl + B
                  </kbd>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-700">Italic text</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono rounded text-[11px] border border-slate-200">
                    Ctrl + I
                  </kbd>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-700">Underline text</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono rounded text-[11px] border border-slate-200">
                    Ctrl + U
                  </kbd>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-700">Heading 1 / 2 / 3</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono rounded text-[11px] border border-slate-200">
                    Ctrl + Alt + 1/2/3
                  </kbd>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-700">Undo / Redo</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono rounded text-[11px] border border-slate-200">
                    Ctrl + Z / Ctrl + Y
                  </kbd>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
