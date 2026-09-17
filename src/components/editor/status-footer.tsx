"use client";

import React from "react";
import { Radio, Sliders } from "lucide-react";
import { SyncStatus } from "@/components/ui/badge";
import { useDemoNetwork } from "@/lib/demo-network-proxy";

interface StatusFooterProps {
  wordsCount: number;
  charactersCount: number;
  syncStatus: SyncStatus;
  roomName: string;
  onToggleDemoTools?: () => void;
}

export function StatusFooter({
  wordsCount,
  charactersCount,
  syncStatus,
  roomName,
  onToggleDemoTools,
}: StatusFooterProps) {
  const config = useDemoNetwork();
  const isSimulationActive =
    config.isManuallyDisconnected ||
    config.latencyMs > 0 ||
    config.packetLossPercent > 0;

  const statusColor = {
    synced: "text-emerald-600 bg-emerald-500",
    syncing: "text-amber-600 bg-amber-500",
    reconnecting: "text-orange-600 bg-orange-500",
    offline: "text-slate-500 bg-slate-400",
  }[syncStatus];

  const statusLabel = {
    synced: "Synced",
    syncing: "Synchronizing…",
    reconnecting: "Reconnecting…",
    offline: "Offline",
  }[syncStatus];

  return (
    <footer className="h-8 bg-white border-t border-slate-200/80 px-3 sm:px-4 flex items-center justify-between text-xs text-slate-500 sticky bottom-0 z-30 select-none">
      {/* Left: Word & character metrics */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium text-slate-800">{wordsCount}</span>
          <span className="text-slate-400">words</span>
        </div>
        <span className="text-slate-300 hidden xs:inline">·</span>
        <div className="hidden xs:flex items-center gap-1">
          <span className="font-medium text-slate-800">{charactersCount}</span>
          <span className="text-slate-400">chars</span>
        </div>
        <span className="text-slate-300 hidden sm:inline">·</span>
        <div className="hidden sm:inline text-slate-400 truncate">
          <span>Reading: </span>
          <span className="font-medium text-slate-700">
            {Math.max(1, Math.ceil(wordsCount / 200))} min
          </span>
        </div>
      </div>

      {/* Right: Yjs Connection Status & Diagnostics */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Simulated Network Indicator */}
        {isSimulationActive ? (
          <button
            type="button"
            onClick={onToggleDemoTools}
            className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded transition-colors hover:bg-amber-100 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
            title="Simulated network state active — click to open Demo Tools"
          >
            <Sliders className="w-2.5 h-2.5 text-amber-600" />
            <span>
              {config.isManuallyDisconnected
                ? "Sim: Offline"
                : `Sim: ${config.latencyMs > 0 ? `+${config.latencyMs}ms` : ""}${
                    config.latencyMs > 0 && config.packetLossPercent > 0 ? " · " : ""
                  }${config.packetLossPercent > 0 ? `${config.packetLossPercent}% loss` : ""}`}
            </span>
          </button>
        ) : (
          onToggleDemoTools && (
            <button
              type="button"
              onClick={onToggleDemoTools}
              className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
              title="Open presentation Demo Tools"
            >
              <Sliders className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Demo tools</span>
            </button>
          )
        )}

        <span className="text-slate-300 hidden sm:inline">·</span>

        <div className="flex items-center gap-1.5" title={`Room: ${roomName}`}>
          <Radio className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-[11px] hidden md:inline text-slate-600">
            room: {roomName}
          </span>
        </div>

        <span className="text-slate-300 hidden md:inline">·</span>

        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${statusColor.split(" ")[1]}`} />
          <span className="font-medium text-slate-700 text-[11px]">
            {statusLabel}
          </span>
        </div>
      </div>
    </footer>
  );
}
