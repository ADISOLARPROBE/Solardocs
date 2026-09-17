# SolarDocs ☀️

> High-performance, local-first rich-text documentation with conflict-free multi-user CRDT synchronization, collaborator presence, and offline resilience.

SolarDocs is built for engineering teams and product builders. Edits converge deterministically across all peers without merge conflicts or Last-Write-Wins lockouts, backed by **TipTap**, **Yjs**, **y-indexeddb**, and **Supabase Row-Level Security**.

---

## 🚂 Railway Deployment (Single Custom Server)

SolarDocs is architected to run both the **Next.js website** and the **Yjs WebSocket collaboration server** as a single custom Node.js server (`server.mjs`) listening on Railway's `PORT` on `0.0.0.0`.

```
                              Railway Domain (Single Port)
                             http://0.0.0.0:$PORT (or wss://)
                                            │
                                            ▼
                                Custom Node HTTP Server
                                     (server.mjs)
                                    │            │
               HTTP Requests        │            │  Upgrade: websocket
        (HTML, Static, API, SSR)    │            │  Path: /yjs/:documentId
                                    ▼            ▼
                                Next.js       y-websocket
                              Request Handle  WebSocketServer
                             (handle(req,res)) (setupWSConnection)
```

### Deploying to Railway Step-by-Step

1. **Create a New Project on Railway:**
   - Go to [railway.app](https://railway.app) and click **"New Project"**.
   - Select **"Deploy from GitHub repo"** and choose your `solardocs` repository.

2. **Build and Start Commands:**
   Railway automatically detects Node.js and uses `package.json`:
   - **Build Command:** `npm run build` (builds the Next.js production bundle)
   - **Start Command:** `npm start` (runs `node server.mjs` in production mode)

3. **Port & Host Binding:**
   - Railway injects the `PORT` environment variable automatically.
   - `server.mjs` binds to `0.0.0.0` on `process.env.PORT`.
   - Normal HTTP requests are handled by Next.js.
   - WebSocket upgrades for collaboration are routed through `/yjs`.

4. **Environment Variables on Railway:**
   Add these in **Railway Dashboard -> Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: *(Optional)* Your Supabase project URL (e.g. `https://your-project.supabase.co`).
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: *(Optional)* Your Supabase publishable/anon public key.
   - `NEXT_PUBLIC_YJS_WEBSOCKET_URL`: *(Optional!)* In unified Railway deployment, SolarDocs automatically routes to `wss://${RAILWAY_STATIC_URL}/yjs` on the same domain and port!

5. **Verify Your Deployment:**
   - Open your generated Railway domain: `https://your-app.up.railway.app`.
   - Verify the health check: `https://your-app.up.railway.app/health`.
   - Open `https://your-app.up.railway.app/editor/demo-doc` in two tabs to test live collaboration over `wss://`!

---

## 🚀 Quick Setup & Local Collaboration Guide

### 1. Required Environment Variables
Create `.env.local` from `.env.local.example`:
```bash
cp .env.local.example .env.local
```
Set the following variables in `.env.local`:
- `NEXT_PUBLIC_YJS_WEBSOCKET_URL=` — (Optional: defaults automatically to `ws://localhost:3000/yjs` on the same port).
- `NEXT_PUBLIC_SUPABASE_URL=` — (Optional for local dev; required in production for Supabase document metadata).
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` — (Optional for local dev; Supabase publishable/anon API key).

### 2. How to Start the Unified Server Locally
Start the unified custom server (Next.js app + Yjs WebSocket on `/yjs`):
```bash
npm run dev
```
- **Next.js Website:** [http://localhost:3000](http://localhost:3000)
- **Collaboration WebSocket:** `ws://localhost:3000/yjs`
- **Health Check:** [http://localhost:3000/health](http://localhost:3000/health)

### 3. How to Test Collaboration in Three Browser Windows
1. Open three separate browser windows (or one regular window and two incognito windows):
   - **Window 1:** `http://localhost:3000/editor/demo-doc`
   - **Window 2:** `http://localhost:3000/editor/demo-doc`
   - **Window 3:** `http://localhost:3000/editor/demo-doc`
2. **Collaborator Presence:** Each window receives a unique random collaborator identity with initials and an assigned color in the top-bar avatar group.
3. **Collaboration Carets:** Click anywhere in Window 1 — Windows 2 and 3 will display your colored cursor and name badge moving in real time.
4. **Concurrent Editing:** Type simultaneously across all three windows. Yjs CRDTs deterministically merge text in real time across all three peers with zero merge conflicts.
5. **Offline Resilience & CRDT Recovery:**
   - In Window 3, click **"Demo tools"** in the top bar and click **"Disconnect"**.
   - Type a paragraph in Window 3 while offline (persisted locally to IndexedDB).
   - In Window 1 and Window 2, continue typing while online.
   - In Window 3, click **"Reconnect"**.
   - Watch both offline and online edits merge automatically across all three windows with zero data loss!

---

## 🏛️ Architecture & Separation of Concerns

| Layer | Responsibility | Storage / Protocol |
|---|---|---|
| **Unified Server** | Single Node.js server on Railway ($PORT, 0.0.0.0) | **Next.js** + **ws** on `/yjs` |
| **Text Editing & CRDTs** | Multi-user concurrent rich text, undo/redo | **Yjs** (`Y.Doc`, `y-websocket`) |
| **Collaborator Presence** | Real-time carets, selection highlights, initials avatars | **Yjs Awareness Protocol** |
| **Offline Persistence** | Immediate local caching, zero data loss during disconnects | **IndexedDB** (`y-indexeddb`) |
| **Document Metadata** | Document titles, ownership, link sharing permissions | **Supabase** (PostgreSQL + RLS) |
| **User Identity** | Anonymous visitor sessions, assigned avatar colors | **Supabase Auth** + local sessions |

> [!NOTE]
> Document body text, Yjs CRDT updates, and live cursors are **never stored in Supabase**. Supabase only manages document metadata and permissions, keeping the database fast, secure, and lean.

---

## ⚙️ Environment Variables Reference

| Variable | Required | Default / Example | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_YJS_WEBSOCKET_URL` | Optional | `wss://[domain]/yjs` | Override WebSocket endpoint (auto-resolves to `/yjs`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional in dev, Required in prod | `https://your-project.supabase.co` | Supabase project API URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional in dev, Required in prod | `eyJhbG...` | Public publishable / anon API key (enforces RLS). |

> [!IMPORTANT]
> **Security Guarantee**: Only `NEXT_PUBLIC_` variables are included in client bundles. **NEVER** expose the Supabase `service_role` key in frontend code or client environment files.

---

## 🛠️ Verification & Quality Checks

Run the automated test suite and static analysis tools:

```bash
# TypeScript compilation check
npx tsc --noEmit

# ESLint validation
npm run lint

# Production bundle build
npm run build

# Start production server
npm start

# Automated Yjs network simulation test (latency, packet loss, offline recovery)
node scratch/test-demo-simulation.mjs
```

---

## 📜 License
MIT License. Created for the SolarDocs Hackathon.
