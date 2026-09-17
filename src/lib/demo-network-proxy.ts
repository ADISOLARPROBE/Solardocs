"use client";

import { useSyncExternalStore } from "react";

export interface DemoNetworkConfig {
  isManuallyDisconnected: boolean;
  latencyMs: number; // 0, 500, 1000, 2000
  packetLossPercent: number; // 0, 10, 30
}

let currentConfig: DemoNetworkConfig = {
  isManuallyDisconnected: false,
  latencyMs: 0,
  packetLossPercent: 0,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getDemoNetworkConfig(): DemoNetworkConfig {
  return currentConfig;
}

export function setDemoLatency(latencyMs: number) {
  currentConfig = { ...currentConfig, latencyMs };
  notify();
}

export function setDemoPacketLoss(packetLossPercent: number) {
  currentConfig = { ...currentConfig, packetLossPercent };
  notify();
}

export function setDemoManualDisconnect(isManuallyDisconnected: boolean) {
  currentConfig = { ...currentConfig, isManuallyDisconnected };
  notify();
}

export function resetDemoNetwork() {
  currentConfig = {
    isManuallyDisconnected: false,
    latencyMs: 0,
    packetLossPercent: 0,
  };
  notify();
}

export function subscribeDemoNetwork(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDemoNetwork(): DemoNetworkConfig {
  return useSyncExternalStore(
    subscribeDemoNetwork,
    getDemoNetworkConfig,
    getDemoNetworkConfig
  );
}

/**
 * Creates a SimulatedWebSocket class wrapping a native WebSocket implementation.
 * Delays incoming/outgoing packets by (latencyMs / 2) to simulate realistic round-trip time.
 * Drops packets probabilistically when packetLossPercent > 0.
 */
export function createSimulatedWebSocketClass(
  BaseWebSocket?: typeof WebSocket
): typeof WebSocket | undefined {
  if (!BaseWebSocket) {
    return undefined;
  }

  return class SimulatedWebSocket extends BaseWebSocket {
    private _customOnMessage: ((this: WebSocket, ev: MessageEvent) => void) | null = null;

    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);
    }

    override send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
      const config = currentConfig;
      if (config.isManuallyDisconnected) {
        return;
      }

      // Simulate outgoing packet loss
      if (config.packetLossPercent > 0 && Math.random() * 100 < config.packetLossPercent) {
        return;
      }

      // Simulate outgoing latency (half of round-trip)
      if (config.latencyMs > 0) {
        setTimeout(() => {
          if (this.readyState === BaseWebSocket.OPEN) {
            super.send(data);
          }
        }, config.latencyMs / 2);
      } else {
        super.send(data);
      }
    }

    override get onmessage(): ((this: WebSocket, ev: MessageEvent) => void) | null {
      return this._customOnMessage;
    }

    override set onmessage(handler: ((this: WebSocket, ev: MessageEvent) => void) | null) {
      this._customOnMessage = handler;
      if (!handler) {
        super.onmessage = null;
        return;
      }

      super.onmessage = (event: MessageEvent) => {
        const config = currentConfig;
        if (config.isManuallyDisconnected) {
          return;
        }

        // Simulate incoming packet loss
        if (config.packetLossPercent > 0 && Math.random() * 100 < config.packetLossPercent) {
          return;
        }

        // Simulate incoming latency (half of round-trip)
        if (config.latencyMs > 0) {
          setTimeout(() => {
            if (this.readyState === BaseWebSocket.OPEN && this._customOnMessage) {
              this._customOnMessage.call(this, event);
            }
          }, config.latencyMs / 2);
        } else {
          handler.call(this, event);
        }
      };
    }

    override addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void {
      if (type === "message" && typeof listener === "function") {
        const messageListener = listener as (ev: MessageEvent) => void;
        const wrappedListener = (ev: Event) => {
          const config = currentConfig;
          if (config.isManuallyDisconnected) return;
          if (config.packetLossPercent > 0 && Math.random() * 100 < config.packetLossPercent) return;
          if (config.latencyMs > 0) {
            setTimeout(() => {
              if (this.readyState === BaseWebSocket.OPEN) {
                messageListener.call(this, ev as MessageEvent);
              }
            }, config.latencyMs / 2);
          } else {
            messageListener.call(this, ev as MessageEvent);
          }
        };
        super.addEventListener(type, wrappedListener, options);
        return;
      }
      super.addEventListener(type, listener, options);
    }
  };
}

export const SimulatedWebSocket =
  typeof window !== "undefined" && window.WebSocket
    ? createSimulatedWebSocketClass(window.WebSocket)
    : undefined;
