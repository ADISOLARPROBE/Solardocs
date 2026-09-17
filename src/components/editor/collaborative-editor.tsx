"use client";

import React, { useEffect, useState, useRef } from "react";
import { Editor, EditorContent } from "@tiptap/react";
import type { AnyExtension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import { EditorTopBar } from "./editor-topbar";
import { EditorToolbar } from "./editor-toolbar";
import { PeopleSidebar } from "./people-sidebar";
import { StatusFooter } from "./status-footer";
import { DemoToolsPanel } from "./demo-tools-panel";
import { SyncStatus } from "@/components/ui/badge";
import { Collaborator } from "@/components/ui/avatar";
import { getOrCreateSessionUser, SessionUser } from "@/lib/collaboration-user";
import {
  SimulatedWebSocket,
  setDemoManualDisconnect,
  getDemoNetworkConfig,
} from "@/lib/demo-network-proxy";
import { getCollaborationWebSocketUrl } from "@/lib/collab-config";
import {
  ensureAnonymousSession,
  syncUserProfile,
  getOrCreateDocument,
  updateDocumentTitle,
  updateDocumentShareSetting,
} from "@/lib/supabase";

const INITIAL_STARTER_CONTENT = `
<h1>SolarDocs Product Requirements</h1>
<p>Welcome to <strong>SolarDocs</strong> — a high-performance, local-first rich-text documentation system designed for engineering teams and product builders.</p>
<h2>Key Architecture</h2>
<p>This editor provides a <u>clean, distraction-free</u> writing surface backed by conflict-free multi-user CRDT synchronization using <strong>TipTap</strong> and <strong>Yjs</strong>.</p>
<h3>Core Features</h3>
<ul>
  <li><strong>Yjs CRDT Synchronization:</strong> Concurrent edits converge deterministically across all peers connected to this room without merge conflicts.</li>
  <li><strong>Focused Typography:</strong> Restrained indigo accents, clean typography, generous margins, and a page-like white writing canvas.</li>
  <li><strong>Rich Text Toolbar:</strong> Fully interactive formatting for headings, bold, italic, underline, ordered and bullet lists, undo, and redo.</li>
</ul>
<h2>Testing Real-Time Collaboration</h2>
<ol>
  <li>Open this exact URL in a second browser window or tab.</li>
  <li>Type or format text in either window and watch both stay perfectly synchronized in real time.</li>
  <li>Check the status bar below for live word count and active room telemetry.</li>
</ol>
`;

interface CollaborativeEditorProps {
  documentId: string;
  initialTitle?: string;
}

export function CollaborativeEditor({
  documentId,
  initialTitle = "Product Requirements Document — SolarDocs",
}: CollaborativeEditorProps) {
  const configuredWsUrl = getCollaborationWebSocketUrl();
  const wsError = !configuredWsUrl
    ? "NEXT_PUBLIC_YJS_WEBSOCKET_URL is not configured. Real-time collaboration is unavailable. Your document is saved locally in offline storage."
    : null;

  const [currentUser] = useState<SessionUser>(() => getOrCreateSessionUser());
  const [editor, setEditor] = useState<Editor | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    configuredWsUrl ? "syncing" : "offline"
  );
  const [isLocalLoaded, setIsLocalLoaded] = useState(false);
  const [wordsCount, setWordsCount] = useState(0);
  const [charsCount, setCharsCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [isLinkEditable, setIsLinkEditable] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => [
    {
      id: currentUser.id,
      name: currentUser.name,
      initials: currentUser.initials,
      color: currentUser.color,
      role: "You",
    },
  ]);
  const [isDemoToolsOpen, setIsDemoToolsOpen] = useState(false);
  const [isDemoConnected, setIsDemoConnected] = useState(true);
  // Force update tick for active toolbar states
  const [, setTick] = useState(0);

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const idbRef = useRef<IndexeddbPersistence | null>(null);
  const hasEverConnectedRef = useRef(false);
  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDemoDisconnect = () => {
    setDemoManualDisconnect(true);
    setIsDemoConnected(false);
    if (providerRef.current) {
      providerRef.current.disconnect();
    }
    setSyncStatus("offline");
  };

  const handleDemoReconnect = () => {
    setDemoManualDisconnect(false);
    setIsDemoConnected(true);
    if (providerRef.current) {
      providerRef.current.connect();
    }
  };

  // Background non-blocking Supabase anonymous auth & metadata synchronization
  useEffect(() => {
    let isMounted = true;

    async function syncSupabase() {
      try {
        const user = await ensureAnonymousSession();
        if (!user || !isMounted) return;

        // Sync visitor's profile using the exact display name and color used for Yjs presence
        await syncUserProfile(user, currentUser);

        // Fetch or create document metadata row
        const docMeta = await getOrCreateDocument(documentId, initialTitle, user.id);
        if (docMeta && isMounted) {
          if (docMeta.title) {
            setTitle(docMeta.title);
          }
          if (typeof docMeta.is_link_editable === "boolean") {
            setIsLinkEditable(docMeta.is_link_editable);
          }
        }
      } catch (err) {
        // Unconfigured or network error in Supabase does not block CRDT editing
        console.debug("[SolarDocs Supabase] Session sync:", err);
      }
    }

    syncSupabase();

    return () => {
      isMounted = false;
      if (titleTimeoutRef.current) {
        clearTimeout(titleTimeoutRef.current);
      }
    };
  }, [documentId, currentUser, initialTitle]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (titleTimeoutRef.current) {
      clearTimeout(titleTimeoutRef.current);
    }
    titleTimeoutRef.current = setTimeout(() => {
      updateDocumentTitle(documentId, newTitle).catch(() => {
        // Silently catch if Supabase is unconfigured or offline
      });
    }, 600);
  };

  const handleToggleShareSetting = async (editable: boolean) => {
    setIsLinkEditable(editable);
    await updateDocumentShareSetting(documentId, editable).catch((err) => {
      console.warn("[SolarDocs Supabase] Failed to update share setting:", err);
    });
  };

  useEffect(() => {
    // 1. Session user identity
    const sessionUser = currentUser;

    // 2. Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // 3. Initialize local-first offline persistence via IndexedDB
    const idbPersistence = new IndexeddbPersistence(documentId, ydoc);
    idbRef.current = idbPersistence;

    // 4. Connect to WebSocket collaboration server if configured
    const wsUrl = configuredWsUrl;
    let provider: WebsocketProvider | null = null;

    if (wsUrl) {
      provider = new WebsocketProvider(wsUrl, documentId, ydoc, {
        connect: true,
        WebSocketPolyfill:
          SimulatedWebSocket ||
          (typeof WebSocket !== "undefined" ? WebSocket : undefined),
      });
      providerRef.current = provider;

      // 5. Register local user identity with Yjs Awareness
      const awareness = provider.awareness;
      awareness.setLocalStateField("user", {
        id: sessionUser.id,
        name: sessionUser.name,
        color: sessionUser.color,
        initials: sessionUser.initials,
        role: "Editor",
      });

      const handleAwarenessChange = () => {
        const states = awareness.getStates();
        const activePeers: Collaborator[] = [];

        states.forEach((state, clientId) => {
          if (state?.user?.name && state?.user?.color) {
            const isSelf = clientId === awareness.clientID;
            activePeers.push({
              id: state.user.id || String(clientId),
              name: state.user.name,
              initials:
                state.user.initials || state.user.name.slice(0, 2).toUpperCase(),
              color: state.user.color,
              role: isSelf ? "You" : (state.user.role || "Editor"),
            });
          }
        });

        // Sort so current user is first, then alphabetical
        activePeers.sort((a, b) => {
          if (a.role === "You") return -1;
          if (b.role === "You") return 1;
          return a.name.localeCompare(b.name);
        });

        setCollaborators(activePeers);
      };

      awareness.on("change", handleAwarenessChange);
      handleAwarenessChange();
    }

    // Unified dynamic sync status updater
    const updateStatus = () => {
      if (!provider) {
        setSyncStatus("offline");
        return;
      }

      if (typeof window !== "undefined" && !navigator.onLine) {
        setSyncStatus("offline");
        return;
      }

      if (
        getDemoNetworkConfig().isManuallyDisconnected ||
        !provider.shouldConnect
      ) {
        setSyncStatus("offline");
        return;
      }

      if (!idbPersistence.synced) {
        setSyncStatus("syncing");
        return;
      }

      if (provider.synced) {
        setSyncStatus("synced");
        return;
      }

      if (provider.wsconnected) {
        setSyncStatus("syncing");
        return;
      }

      if (provider.wsconnecting) {
        if (
          hasEverConnectedRef.current ||
          provider.wsUnsuccessfulReconnects > 0
        ) {
          setSyncStatus("reconnecting");
        } else {
          setSyncStatus("syncing");
        }
        return;
      }

      // Disconnected: if attempting reconnection show reconnecting, else offline
      if (
        hasEverConnectedRef.current ||
        provider.wsUnsuccessfulReconnects > 0
      ) {
        setSyncStatus("reconnecting");
      } else {
        setSyncStatus("offline");
      }
    };

    idbPersistence.on("synced", updateStatus);

    const handleStatus = (event: {
      status: "connecting" | "connected" | "disconnected";
    }) => {
      if (event.status === "connected") {
        hasEverConnectedRef.current = true;
        setIsDemoConnected(true);
      } else if (event.status === "disconnected") {
        setIsDemoConnected(false);
      }
      updateStatus();
    };

    const handleSync = (isSynced: boolean) => {
      if (isSynced) {
        hasEverConnectedRef.current = true;
      }
      updateStatus();
    };

    const handleOnline = () => {
      updateStatus();
    };

    const handleOffline = () => {
      setSyncStatus("offline");
    };

    if (provider) {
      provider.on("status", handleStatus);
      provider.on("sync", handleSync);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 6. Initialize TipTap editor with Collaboration & optional CollaborationCursor extensions
    const documentFragment = ydoc.getXmlFragment("document");

    const editorExtensions: AnyExtension[] = [
      StarterKit.configure({
        history: false, // Yjs Collaboration extension handles undo/redo
      }),
      Underline,
      Collaboration.configure({
        document: ydoc,
        field: "document",
        fragment: documentFragment,
      }),
    ];

    if (provider) {
      editorExtensions.push(
        CollaborationCursor.configure({
          provider,
          user: {
            name: sessionUser.name,
            color: sessionUser.color,
            initials: sessionUser.initials,
          },
          render: (user) => {
            const cursor = document.createElement("span");
            cursor.classList.add("collaboration-cursor__caret");
            cursor.setAttribute("style", `border-color: ${user.color};`);

            const label = document.createElement("div");
            label.classList.add("collaboration-cursor__label");
            label.setAttribute("style", `background-color: ${user.color};`);
            label.textContent = user.name;

            cursor.appendChild(label);
            return cursor;
          },
          selectionRender: (user) => {
            return {
              class: "collaboration-cursor__selection",
              style: `background-color: ${user.color}35;`,
            };
          },
        })
      );
    }

    const editorInstance = new Editor({
      extensions: editorExtensions,
      editorProps: {
        attributes: {
          class:
            "focus:outline-none min-h-[680px] p-6 sm:p-10 md:p-14 text-slate-800 leading-relaxed",
        },
      },
      onCreate: ({ editor }) => {
        const text = editor.getText();
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        setWordsCount(words);
        setCharsCount(text.length);
      },
      onUpdate: ({ editor }) => {
        const text = editor.getText();
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        setWordsCount(words);
        setCharsCount(text.length);
        setTick((t) => t + 1);
      },
      onSelectionUpdate: () => {
        setTick((t) => t + 1);
      },
      onTransaction: () => {
        setTick((t) => t + 1);
      },
    });

    // 7. Load locally persisted Yjs content before showing the editor as ready
    idbPersistence.whenSynced.then(() => {
      setEditor(editorInstance);
      setIsLocalLoaded(true);

      // Check if local document already has persisted content
      const yXml = ydoc.getXmlFragment("document");
      if (yXml.length > 0) {
        // Content was restored from local IndexedDB! Never overwrite local data.
        return;
      }

      // If no remote collaboration provider, seed starter content directly if empty
      if (!provider) {
        if (yXml.length === 0 && editorInstance.isEmpty) {
          editorInstance.commands.setContent(INITIAL_STARTER_CONTENT);
        }
        return;
      }

      // If local cache is empty, seed only if server is also synced & empty
      if (provider.synced) {
        if (yXml.length === 0 && editorInstance.isEmpty) {
          editorInstance.commands.setContent(INITIAL_STARTER_CONTENT);
        }
      } else {
        const onSyncOnce = (synced: boolean) => {
          if (synced && yXml.length === 0 && editorInstance.isEmpty) {
            editorInstance.commands.setContent(INITIAL_STARTER_CONTENT);
          }
        };
        provider.once("sync", onSyncOnce);

        // Fallback: seed starter content if server unreachable and document is brand new
        setTimeout(() => {
          if (yXml.length === 0 && editorInstance.isEmpty) {
            editorInstance.commands.setContent(INITIAL_STARTER_CONTENT);
          }
        }, 1200);
      }
    });

    // 8. Teardown and cleanup on page close or component unmount
    const handlePageClose = () => {
      try {
        if (provider) {
          provider.awareness.setLocalState(null);
          provider.destroy();
        }
        editorInstance.destroy();
        idbPersistence.destroy();
        ydoc.destroy();
      } catch {
        // Silently ignore already destroyed instances during fast exit
      }
    };

    window.addEventListener("beforeunload", handlePageClose);
    window.addEventListener("pagehide", handlePageClose);

    return () => {
      window.removeEventListener("beforeunload", handlePageClose);
      window.removeEventListener("pagehide", handlePageClose);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (provider) {
        try {
          provider.awareness.setLocalState(null);
        } catch {
          // Ignore
        }
        provider.off("status", handleStatus);
        provider.off("sync", handleSync);
        provider.destroy();
      }
      editorInstance.destroy();
      idbPersistence.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      idbRef.current = null;
      setEditor(null);
    };
  }, [documentId, currentUser, configuredWsUrl]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar */}
      <EditorTopBar
        documentId={documentId}
        documentTitle={title}
        onTitleChange={handleTitleChange}
        syncStatus={syncStatus}
        collaborators={collaborators}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        isLinkEditable={isLinkEditable}
        onToggleShareSetting={handleToggleShareSetting}
        onToggleDemoTools={() => setIsDemoToolsOpen((prev) => !prev)}
        isDemoToolsOpen={isDemoToolsOpen}
      />

      {/* Formatting Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Main Workspace Layout with Optional Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scrollable Center Canvas Area */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 sm:py-10 md:py-12 flex justify-center">
          <div className="w-full max-w-4xl">
            {/* Document Header Metadata / Eyebrow */}
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400 px-1 select-none">
              <span className="font-mono uppercase tracking-wider text-[11px]">
                Document / {documentId}
              </span>
              <span className="text-[11px]">All changes saved to CRDT room</span>
            </div>

            {/* Connection Error Banner if WebSocket URL is not configured */}
            {wsError && (
              <div className="mb-4 p-3.5 bg-amber-50/90 border border-amber-200/90 text-amber-950 rounded-lg flex items-start gap-3 text-xs shadow-2xs">
                <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5 text-amber-800 font-bold text-[11px]">
                  !
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 text-xs">
                      Collaboration Connection Error
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-100/90 border border-amber-300 text-amber-800 rounded font-medium shrink-0">
                      Offline Mode Active
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                    Environment variable <code className="bg-amber-100/80 text-amber-900 px-1 py-0.5 rounded font-mono text-[10px] font-medium border border-amber-200">NEXT_PUBLIC_YJS_WEBSOCKET_URL</code> is missing. Real-time multi-user syncing is disabled, but you can continue editing offline with local IndexedDB storage.
                  </p>
                </div>
              </div>
            )}

            {/* White Paper Editor Surface */}
            <div className="bg-white border border-slate-200/80 rounded-lg shadow-2xs hover:border-slate-300 transition-colors">
              {!isLocalLoaded ? (
                <div className="min-h-[680px] p-8 md:p-14 flex flex-col items-center justify-center text-slate-400 select-none">
                  <div className="w-7 h-7 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin mb-3" />
                  <span className="text-xs font-medium text-slate-700">
                    Loading document from offline storage…
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Checking local IndexedDB cache
                  </span>
                </div>
              ) : (
                <EditorContent editor={editor} />
              )}
            </div>

            {/* Canvas Footer Hint */}
            <div className="mt-4 text-center text-[11px] text-slate-400 select-none pb-8">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono border border-slate-200">Tab</kbd> to indent, or use the toolbar above for formatting.
            </div>
          </div>
        </main>

        {/* Optional Collapsible People Sidebar */}
        <PeopleSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          documentId={documentId}
          collaborators={collaborators}
          currentUserId={currentUser.id}
        />
      </div>

      {/* Docked Status Area */}
      <StatusFooter
        wordsCount={wordsCount}
        charactersCount={charsCount}
        syncStatus={syncStatus}
        roomName={documentId}
        onToggleDemoTools={() => setIsDemoToolsOpen((prev) => !prev)}
      />

      {/* Presentation-Only Demo Tools Panel */}
      <DemoToolsPanel
        isOpen={isDemoToolsOpen}
        onClose={() => setIsDemoToolsOpen(false)}
        onDisconnect={handleDemoDisconnect}
        onReconnect={handleDemoReconnect}
        isConnected={isDemoConnected}
      />
    </div>
  );
}
