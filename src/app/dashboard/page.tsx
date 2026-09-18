"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SunMedium,
  Plus,
  Search,
  FileText,
  Clock,
  Users,
  UserCheck,
  FolderOpen,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  X,
  Share2,
  LogIn,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarStack, Collaborator } from "@/components/ui/avatar";
import { getOrCreateLocalUser, updateLocalUserIdentity, SessionUser } from "@/lib/collaboration-user";
import {
  ensureAnonymousSession,
  syncUserProfile,
  getUserDocuments,
  createDocument,
  getProfile,
  signOutUser,
  type DocumentWithMembers,
} from "@/lib/supabase";

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentWithMembers[]>([]);

  useEffect(() => {
    const user = getOrCreateLocalUser();
    setCurrentUser(user);
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "recent" | "owned" | "shared">("all");

  useEffect(() => {
    if (!currentUser) return;
    const sessionUser = currentUser;
    let isMounted = true;

    async function fetchDocs() {
      try {
        const authUser = await ensureAnonymousSession();
        if (!isMounted) return;
        if (authUser) {
          const isAuthed = !authUser.is_anonymous;
          setIsAuthenticated(isAuthed);
          setUserEmail(authUser.email || null);

          let activeUser = sessionUser;
          if (isAuthed) {
            const profile = await getProfile(authUser.id);
            const realName =
              profile?.display_name ||
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              authUser.email?.split("@")[0];

            if (realName && realName !== sessionUser.name) {
              const updated = updateLocalUserIdentity(realName, profile?.avatar_color);
              activeUser = updated;
              if (isMounted) {
                setCurrentUser(updated);
              }
            }
          }

          await syncUserProfile(authUser, activeUser);
          const userDocs = await getUserDocuments(authUser.id);
          if (isMounted) {
            setDocuments(userDocs);
          }
        } else {
          if (isMounted) {
            setDocuments([]);
          }
        }
      } catch (err) {
        console.warn("[SolarDocs Dashboard] Error loading documents:", err);
        if (isMounted) {
          setErrorMessage("Could not connect to document service. You can still create new local documents.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDocs();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleRetry = () => {
    if (!currentUser) return;
    const sessionUser = currentUser;
    setIsLoading(true);
    setErrorMessage(null);
    ensureAnonymousSession()
      .then(async (authUser) => {
        if (authUser) {
          await syncUserProfile(authUser, sessionUser);
          const userDocs = await getUserDocuments(authUser.id);
          setDocuments(userDocs);
        }
      })
      .catch((err) => {
        console.warn("[SolarDocs Dashboard] Retry error:", err);
        setErrorMessage("Could not connect to document service.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/login");
  };

  const handleCreateDocument = async () => {
    setIsCreating(true);
    try {
      const authUser = await ensureAnonymousSession();
      const ownerId = authUser?.id || currentUser?.id || "anonymous";
      const newDoc = await createDocument(ownerId, "Untitled document");
      if (newDoc?.id) {
        router.push(`/editor/${newDoc.id}`);
      } else {
        const fallbackId = `doc-${Math.random().toString(36).substring(2, 9)}`;
        router.push(`/editor/${fallbackId}`);
      }
    } catch (err) {
      console.error("[SolarDocs Dashboard] Error creating document:", err);
      const fallbackId = `doc-${Math.random().toString(36).substring(2, 9)}`;
      router.push(`/editor/${fallbackId}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter and search computation
  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || doc.title.toLowerCase().includes(q) || doc.id.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeFilter === "owned") {
      return doc.isOwner;
    }
    if (activeFilter === "shared") {
      return !doc.isOwner || doc.is_link_editable;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top App Header */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-900 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
              <SunMedium className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight">SolarDocs</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-medium text-slate-500">Workspace</span>
        </div>

        <div className="flex items-center gap-2.5">
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5 text-xs text-slate-600 hover:text-slate-900"
              title="Sign out of SolarDocs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign in</span>
              </Button>
            </Link>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateDocument}
            disabled={isCreating}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreating ? "Creating…" : "New document"}</span>
          </Button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar: Compact Navigation */}
        <aside className="w-full md:w-52 shrink-0 space-y-5 select-none">
          {/* Active Visitor Profile Badge */}
          <div className="bg-white border border-slate-200/80 rounded-lg p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2.5">
              {currentUser ? (
                <>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0 shadow-2xs"
                    style={{ backgroundColor: currentUser.color }}
                  >
                    {currentUser.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-900 truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {isAuthenticated ? (userEmail || "Signed In") : "Guest Session"}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="w-20 h-3 bg-slate-100 rounded" />
                    <div className="w-14 h-2 bg-slate-100 rounded" />
                  </div>
                </>
              )}
            </div>

            {/* Account Quick Action */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign out</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium transition-colors"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Sign in</span>
                </Link>
              )}
            </div>
          </div>

          {/* Navigation Filters */}
          <div className="space-y-1">
            <button
              onClick={() => setActiveFilter("all")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeFilter === "all"
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/60 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5" />
                <span>All documents</span>
              </div>
              <span className="text-[10px] text-slate-400">{documents.length}</span>
            </button>

            <button
              onClick={() => setActiveFilter("recent")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeFilter === "recent"
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/60 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Recent</span>
              </div>
            </button>

            <button
              onClick={() => setActiveFilter("owned")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeFilter === "owned"
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/60 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Owned by me</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {documents.filter((d) => d.isOwner).length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter("shared")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeFilter === "shared"
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/60 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                <span>Shared with me</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {documents.filter((d) => !d.isOwner || d.is_link_editable).length}
              </span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-400 leading-relaxed px-1">
            Documents persist conflict-free via Yjs CRDTs and Supabase metadata.
          </div>
        </aside>

        {/* Right Content: Document Workspace */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search documents by title or id…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 placeholder:text-slate-400 text-slate-800 transition-colors shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 self-center">
              {filteredDocs.length} {filteredDocs.length === 1 ? "document" : "documents"}
            </div>
          </div>

          {/* Error State Banner */}
          {errorMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{errorMessage}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleRetry} className="text-xs h-7">
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {/* Loading State: Skeleton Rows */}
          {isLoading && (
            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden shadow-2xs">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3.5 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-slate-100" />
                    <div className="space-y-1.5">
                      <div className="w-48 h-3.5 bg-slate-200 rounded" />
                      <div className="w-24 h-2.5 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-3 bg-slate-100 rounded hidden sm:block" />
                    <div className="w-12 h-5 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredDocs.length === 0 && (
            <div className="bg-white border border-dashed border-slate-200 rounded-lg p-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-800">
                  {searchQuery ? "No matching documents" : "No documents yet"}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {searchQuery
                    ? `No documents match "${searchQuery}". Try a different keyword or clear search.`
                    : "Create your first collaborative document to write with real-time CRDT synchronization."}
                </p>
              </div>
              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={handleCreateDocument} disabled={isCreating}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>{isCreating ? "Creating…" : "Create document"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Document Rows Workspace List */}
          {!isLoading && filteredDocs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden shadow-2xs">
              {filteredDocs.map((doc) => {
                const docCollaborators: Collaborator[] = (doc.collaborators || []).map((c) => ({
                  id: c.id,
                  name: c.display_name,
                  color: c.avatar_color,
                  initials: c.display_name.slice(0, 2).toUpperCase(),
                  role: "Editor",
                }));

                return (
                  <div
                    key={doc.id}
                    onClick={() => router.push(`/editor/${doc.id}`)}
                    className="p-3.5 sm:px-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    {/* Left: Document Icon & Title */}
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {doc.title || "Untitled document"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{doc.id}</span>
                          {doc.is_link_editable && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded font-sans font-medium">
                              <Share2 className="w-2.5 h-2.5" />
                              Link editable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Role, Avatars, Updated Time, Open Link */}
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0 select-none">
                      {/* Role Badge */}
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          doc.isOwner
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200/60"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {doc.isOwner ? "Owner" : "Member"}
                      </span>

                      {/* Collaborators Avatar Stack */}
                      <div className="hidden sm:flex items-center">
                        <AvatarStack collaborators={docCollaborators} max={3} />
                      </div>

                      {/* Updated Time */}
                      <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(doc.updated_at)}</span>
                      </div>

                      {/* Arrow link */}
                      <div className="text-slate-300 group-hover:text-indigo-600 transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
