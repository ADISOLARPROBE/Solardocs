"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SunMedium, Share2, Users, Check, Copy, Sliders } from "lucide-react";
import { SyncBadge, SyncStatus } from "@/components/ui/badge";
import { AvatarStack, Collaborator } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDemoNetwork } from "@/lib/demo-network-proxy";

interface EditorTopBarProps {
  documentId: string;
  documentTitle: string;
  onTitleChange?: (title: string) => void;
  syncStatus: SyncStatus;
  collaborators?: Collaborator[];
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  isLinkEditable?: boolean;
  onToggleShareSetting?: (isLinkEditable: boolean) => void;
  onToggleDemoTools?: () => void;
  isDemoToolsOpen?: boolean;
}

export function EditorTopBar({
  documentId,
  documentTitle,
  onTitleChange,
  syncStatus,
  collaborators = [],
  onToggleSidebar,
  isSidebarOpen = false,
  isLinkEditable = false,
  onToggleShareSetting,
  onToggleDemoTools,
  isDemoToolsOpen = false,
}: EditorTopBarProps) {
  const demoNetwork = useDemoNetwork();
  const isSimulationActive =
    demoNetwork.isManuallyDisconnected ||
    demoNetwork.latencyMs > 0 ||
    demoNetwork.packetLossPercent > 0;

  const [prevDocTitle, setPrevDocTitle] = useState(documentTitle);
  const [title, setTitle] = useState(documentTitle);
  const [isCopied, setIsCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  if (documentTitle !== prevDocTitle) {
    setPrevDocTitle(documentTitle);
    setTitle(documentTitle);
  }

  const sharePath = `/editor/${documentId}`;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}${sharePath}`;
      navigator.clipboard.writeText(fullUrl).catch(() => {
        navigator.clipboard.writeText(sharePath);
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };


  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Logo & Document Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Link
          href="/dashboard"
          title="Back to Dashboard"
          className="flex items-center gap-2 text-slate-800 hover:text-indigo-600 transition-colors py-1 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
            <SunMedium className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight hidden sm:inline text-slate-900">
            SolarDocs
          </span>
        </Link>

        <span className="text-slate-300 hidden xs:inline">/</span>

        {/* Inline editable document title */}
        <div className="relative group min-w-0 max-w-[115px] xs:max-w-[170px] sm:max-w-xs md:max-w-md">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              onTitleChange?.(e.target.value);
            }}
            aria-label="Document Title"
            className="text-xs sm:text-sm font-medium text-slate-800 bg-transparent px-1.5 sm:px-2 py-1 rounded hover:bg-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-transparent hover:border-slate-200 focus:border-indigo-400 truncate transition-colors w-full"
            placeholder="Untitled Document"
          />
        </div>

        {/* Compact dynamic sync badge (desktop) */}
        <div className="hidden lg:flex items-center ml-1">
          <SyncBadge status={syncStatus} />
        </div>
      </div>

      {/* Right: Sync indicator (mobile/tablet), Collaborators, Sidebar toggle, Share Button */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Sync badge on tablet and mobile */}
        <div className="lg:hidden flex items-center">
          <SyncBadge status={syncStatus} className="text-[11px] px-1.5 py-0.5" />
        </div>

        {/* Collaborators Avatar Stack - visible on all screen sizes */}
        <div className="flex items-center">
          <AvatarStack collaborators={collaborators} max={2} size="sm" />
        </div>

        {/* Toggle People Sidebar Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? "Close People Sidebar" : "View Collaborators & Telemetry"}
            className={`p-1.5 rounded-md border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isSidebarOpen
                ? "bg-indigo-50 text-indigo-700 border-indigo-200/80 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 border-transparent hover:border-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
        )}

        {/* Toggle Demo Tools Button */}
        {onToggleDemoTools && (
          <button
            onClick={onToggleDemoTools}
            title={isDemoToolsOpen ? "Close Demo Tools" : "Demo Tools (Simulate network failure & recovery)"}
            className={`relative p-1.5 rounded-md border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isDemoToolsOpen || isSimulationActive
                ? "bg-indigo-50 text-indigo-700 border-indigo-200/80 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 border-transparent hover:border-slate-200"
            }`}
          >
            <Sliders className="w-4 h-4" />
            {isSimulationActive && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500 ring-1 ring-white" />
            )}
          </button>
        )}

        {/* Share Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowShareModal(true)}
          className="gap-1.5 shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </Button>
      </div>

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200/90 shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Share document
                </h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Anyone with this URL can open this document and collaborate with live CRDT synchronization.
            </p>

            {/* Copyable Link */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
                Shareable link
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={sharePath}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-700 outline-none select-all focus:border-indigo-400 focus:bg-white"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Anyone with the link can edit Toggle */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-slate-800">
                  Anyone with the link can edit
                </div>
                <div className="text-[11px] text-slate-500 leading-snug">
                  Allow visitors with this link to modify document metadata
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isLinkEditable}
                onClick={() => onToggleShareSetting?.(!isLinkEditable)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isLinkEditable ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-2xs ring-0 transition duration-200 ease-in-out ${
                    isLinkEditable ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
              <span className="font-mono text-[11px]">
                {isLinkEditable ? "Public edit enabled" : "Restricted to members"}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowShareModal(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
