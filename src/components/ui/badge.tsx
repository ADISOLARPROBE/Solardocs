import React from "react";

export type SyncStatus = "synced" | "syncing" | "reconnecting" | "offline";

interface BadgeProps {
  status: SyncStatus;
  className?: string;
}

export function SyncBadge({ status, className = "" }: BadgeProps) {
  const configs = {
    synced: {
      label: "Synced",
      containerClasses: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
      dotClasses: "bg-emerald-500",
    },
    syncing: {
      label: "Synchronizing…",
      containerClasses: "bg-amber-50 text-amber-700 border-amber-200/60",
      dotClasses: "bg-amber-500 animate-pulse",
    },
    reconnecting: {
      label: "Reconnecting…",
      containerClasses: "bg-orange-50 text-orange-700 border-orange-200/60",
      dotClasses: "bg-orange-500 animate-pulse",
    },
    offline: {
      label: "Offline",
      containerClasses: "bg-slate-100 text-slate-600 border-slate-200",
      dotClasses: "bg-slate-400",
    },
  }[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${configs.containerClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${configs.dotClasses}`} />
      <span>{configs.label}</span>
    </div>
  );
}
