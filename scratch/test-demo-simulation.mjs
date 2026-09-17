import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { WebSocket as WsWebSocket } from "ws";

// Simulate network proxy logic matching src/lib/demo-network-proxy.ts
let config = {
  isManuallyDisconnected: false,
  latencyMs: 0,
  packetLossPercent: 0,
};

class SimulatedWebSocket extends WsWebSocket {
  _customOnMessage = null;

  constructor(url, protocols) {
    super(url, protocols);
  }

  send(data) {
    if (config.isManuallyDisconnected) return;
    if (config.packetLossPercent > 0 && Math.random() * 100 < config.packetLossPercent) {
      console.log(`  [SimulatedWS] Dropped outgoing packet (${config.packetLossPercent}% loss)`);
      return;
    }
    if (config.latencyMs > 0) {
      setTimeout(() => {
        if (this.readyState === WsWebSocket.OPEN) {
          super.send(data);
        }
      }, config.latencyMs / 2);
    } else {
      super.send(data);
    }
  }

  get onmessage() {
    return this._customOnMessage;
  }

  set onmessage(handler) {
    this._customOnMessage = handler;
    if (!handler) {
      super.onmessage = null;
      return;
    }
    super.onmessage = (event) => {
      if (config.isManuallyDisconnected) return;
      if (config.packetLossPercent > 0 && Math.random() * 100 < config.packetLossPercent) {
        console.log(`  [SimulatedWS] Dropped incoming packet (${config.packetLossPercent}% loss)`);
        return;
      }
      if (config.latencyMs > 0) {
        setTimeout(() => {
          if (this.readyState === WsWebSocket.OPEN && this._customOnMessage) {
            this._customOnMessage.call(this, event);
          }
        }, config.latencyMs / 2);
      } else {
        handler.call(this, event);
      }
    };
  }
}

async function runTest() {
  console.log("=== SolarDocs Demo Tools Network Simulation Test ===");

  const roomName = `demo-sim-test-${Date.now()}`;
  const docA = new Y.Doc();
  const docB = new Y.Doc();

  const providerA = new WebsocketProvider("ws://127.0.0.1:1234", roomName, docA, {
    WebSocketPolyfill: SimulatedWebSocket,
  });

  const providerB = new WebsocketProvider("ws://127.0.0.1:1234", roomName, docB, {
    WebSocketPolyfill: SimulatedWebSocket,
  });

  const textA = docA.getText("content");
  const textB = docB.getText("content");

  // 1. Wait for initial sync
  await new Promise((res) => setTimeout(res, 400));
  textA.insert(0, "Initial document text. ");
  await new Promise((res) => setTimeout(res, 300));

  console.log("1. Initial sync:");
  console.log("   Client A:", JSON.stringify(textA.toString()));
  console.log("   Client B:", JSON.stringify(textB.toString()));
  if (textA.toString() !== textB.toString()) {
    throw new Error("Initial sync failed");
  }

  // 2. Test simulated latency
  console.log("\n2. Testing 500ms simulated latency...");
  config.latencyMs = 500;
  textA.insert(textA.length, "Text sent with 500ms latency. ");
  // Immediately check Client B (should not have it yet due to latency)
  console.log("   Client B immediately after write (expecting lag):", JSON.stringify(textB.toString()));
  // Wait for round-trip latency to deliver packet
  await new Promise((res) => setTimeout(res, 700));
  console.log("   Client B after latency elapsed:", JSON.stringify(textB.toString()));
  if (textA.toString() !== textB.toString()) {
    throw new Error("Latency test failed to deliver");
  }

  // 3. Test simulated packet loss
  console.log("\n3. Testing 30% simulated packet loss...");
  config.latencyMs = 0;
  config.packetLossPercent = 30;
  for (let i = 1; i <= 5; i++) {
    textB.insert(textB.length, `Loss-tolerant chunk ${i}. `);
    await new Promise((res) => setTimeout(res, 100));
  }
  // Allow resync to catch up
  await new Promise((res) => setTimeout(res, 800));
  console.log("   Client A after packet loss test:", JSON.stringify(textA.toString()));
  console.log("   Client B after packet loss test:", JSON.stringify(textB.toString()));

  // 4. Test Disconnect & Offline Editing
  console.log("\n4. Testing Disconnect and Offline Editing...");
  config.packetLossPercent = 0;
  config.isManuallyDisconnected = true;
  providerA.disconnect();
  console.log("   Client A disconnected. wsconnected =", providerA.wsconnected);

  // Edit offline on Client A
  textA.insert(textA.length, "[Offline edit from A while disconnected] ");
  // Edit concurrently on Client B
  textB.insert(textB.length, "[Concurrent edit from B while A offline] ");

  console.log("   Client A (offline):", JSON.stringify(textA.toString()));
  console.log("   Client B (online):", JSON.stringify(textB.toString()));

  // Verify B has NOT received A's edits
  if (textB.toString().includes("Offline edit from A")) {
    throw new Error("Client B received edits while A was supposed to be disconnected");
  }

  // 5. Test Reconnect and Automatic CRDT Recovery
  console.log("\n5. Testing Reconnect and Automatic CRDT Recovery...");
  config.isManuallyDisconnected = false;
  providerA.connect();

  await new Promise((res) => setTimeout(res, 600));

  console.log("   Client A after reconnect:", JSON.stringify(textA.toString()));
  console.log("   Client B after reconnect:", JSON.stringify(textB.toString()));

  if (textA.toString() !== textB.toString()) {
    throw new Error(`CRDT merge mismatch! A: "${textA.toString()}", B: "${textB.toString()}"`);
  }

  // Verify both offline edit from A and concurrent edit from B are present
  if (
    !textA.toString().includes("Offline edit from A") ||
    !textA.toString().includes("Concurrent edit from B")
  ) {
    throw new Error("One of the edits was lost during reconnection!");
  }

  console.log("\nSUCCESS: All simulated network failure and recovery tests PASSED!");

  providerA.destroy();
  providerB.destroy();
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
