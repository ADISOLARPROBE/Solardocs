"use client";

import React from "react";
import {
  Sliders,
  X,
  Wifi,
  WifiOff,
  RotateCcw,
  Clock,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDemoNetwork,
  setDemoLatency,
  setDemoPacketLoss,
  resetDemoNetwork,
} from "@/lib/demo-network-proxy";

interface DemoToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
  isConnected: boolean;
}

const LATENCY_OPTIONS = [
  { label: "0 ms", value: 0 },
  { label: "500 ms", value: 500 },
  { label: "1 s", value: 1000 },
  { label: "2 s", value: 2000 },
];

const PACKET_LOSS_OPTIONS = [
  { label: "0%", value: 0 },
  { label: "10%", value: 10 },
  { label: "30%", value: 30 },
];

export function DemoToolsPanel({
  isOpen,
  onClose,
  onDisconnect,
  onReconnect,
  isConnected,
}: DemoToolsPanelProps) {
  const config = useDemoNetwork();

  if (!isOpen) return null;

  const isSimulationActive =
    !isConnected || config.latencyMs > 0 || config.packetLossPercent > 0;

  const handleReset = () => {
    resetDemoNetwork();
    if (!isConnected) {
      onReconnect();
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Demo Network Simulation Tools"
      className="fixed bottom-11 right-3 sm:right-4 z-40 w-80 sm:w-88 bg-white border border-slate-200/90 rounded-lg shadow-xl p-4 select-none animate-in fade-in slide-in-from-bottom-2 duration-150 text-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-slate-900">Demo Tools</h3>
              <span className="text-[10px] font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1 py-0.2 rounded">
                Presentation
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Network failure & recovery test</p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close demo tools"
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Network Connection Controls */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-medium text-slate-600">Connection State</span>
            <span
              className={`inline-flex items-center gap-1 font-medium text-[10px] px-1.5 py-0.2 rounded border ${
                isConnected
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200/60"
                  : "text-amber-700 bg-amber-50 border-amber-200/60"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                }`}
              />
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={!isConnected ? "primary" : "secondary"}
              size="sm"
              onClick={onDisconnect}
              disabled={!isConnected}
              className="gap-1 text-xs justify-center"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </Button>

            <Button
              variant={!isConnected ? "primary" : "secondary"}
              size="sm"
              onClick={onReconnect}
              disabled={isConnected}
              className="gap-1 text-xs justify-center"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Reconnect</span>
            </Button>
          </div>
        </div>

        {/* Simulated Latency Controls */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <div className="flex items-center gap-1 font-medium text-slate-600">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Simulated Latency</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {config.latencyMs === 0 ? "Real-time (0ms)" : `+${config.latencyMs}ms RTT`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {LATENCY_OPTIONS.map((opt) => {
              const isActive = config.latencyMs === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDemoLatency(opt.value)}
                  className={`py-1 px-1.5 text-[11px] font-medium rounded border transition-colors cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-2xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/60"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Simulated Packet Loss Controls */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <div className="flex items-center gap-1 font-medium text-slate-600">
              <Radio className="w-3 h-3 text-slate-400" />
              <span>Simulated Packet Loss</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {config.packetLossPercent === 0 ? "0% drop" : `${config.packetLossPercent}% drop rate`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {PACKET_LOSS_OPTIONS.map((opt) => {
              const isActive = config.packetLossPercent === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDemoPacketLoss(opt.value)}
                  className={`py-1 px-1.5 text-[11px] font-medium rounded border transition-colors cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold border-indigo-200/80 shadow-2xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/60"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info & Reset */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Edits persist in IndexedDB</span>
            </div>

            {isSimulationActive && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset to normal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
