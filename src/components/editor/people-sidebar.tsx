"use client";

import React from "react";
import { X, Wifi, ShieldCheck } from "lucide-react";
import { Collaborator } from "@/components/ui/avatar";

interface PeopleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  collaborators?: Collaborator[];
  currentUserId?: string;
}

export function PeopleSidebar({
  isOpen,
  onClose,
  documentId,
  collaborators = [],
  currentUserId,
}: PeopleSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop overlay to prevent crushing the canvas */}
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        aria-label="Collaborators and Session Info"
        className="fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-slate-200 shadow-xl flex flex-col h-full md:static md:z-20 md:h-[calc(100vh-3.5rem)] md:shadow-none shrink-0 select-none animate-in slide-in-from-right-4 duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">People & Sync</h2>
            <p className="text-xs text-slate-500 truncate max-w-[180px]">Room: {documentId}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Collaborators List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Active Collaborators ({collaborators.length})
            </span>
            <div className="space-y-1.5">
              {collaborators.map((person) => {
                const isCurrent = currentUserId && person.id === currentUserId;
                return (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-2xs"
                          style={{ backgroundColor: person.color }}
                        >
                          {person.initials}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5 truncate">
                          <span className="truncate">{person.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1 rounded font-medium shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {person.role || (isCurrent ? "You" : "Editor")}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-1.5 py-0.5 rounded font-mono shrink-0 ml-2">
                      Online
                    </span>
                  </div>
                );
              })}
              {collaborators.length === 0 && (
                <div className="text-xs text-slate-400 py-3 text-center italic">
                  Connecting to peers…
                </div>
              )}
            </div>
          </div>

          {/* Real-time Session Meta */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Session Details
            </span>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-slate-50 border border-slate-200/60">
                <Wifi className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-medium text-slate-800 block">CRDT Vector Clock</span>
                  <p className="text-[11px] text-slate-500">Yjs State Synchronized</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-slate-50 border border-slate-200/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-medium text-slate-800 block">Conflict-Free Resolution</span>
                  <p className="text-[11px] text-slate-500">No Last-Write-Wins locks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
