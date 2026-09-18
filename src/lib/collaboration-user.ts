export interface SessionUser {
  id: string;
  name: string;
  color: string;
  initials: string;
  role?: string;
}

const REALISTIC_NAMES: string[] = [
  "Sophia Chen",
  "Marcus Vance",
  "Elena Rostova",
  "Liam Patel",
  "Maya Lin",
  "Julian Brooks",
  "Amara Okafor",
  "Devon Taylor",
  "Chloe Dubois",
  "Kai Nakamura",
  "Zara Khan",
  "Lucas Miller",
  "Nina Rossi",
  "Ethan Wright",
  "Aria Sharma",
  "Noah Kim",
];

const COLLAB_COLORS: string[] = [
  "#2563EB", // Blue
  "#7C3AED", // Violet
  "#059669", // Emerald
  "#D97706", // Amber
  "#E11D48", // Rose
  "#0891B2", // Cyan
  "#4F46E5", // Indigo
  "#DB2777", // Pink
  "#0D9488", // Teal
  "#9333EA", // Purple
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const STORAGE_KEY = "solardocs_collaborator_user";
const LEGACY_STORAGE_KEY = "solardocs_session_user";

/**
 * Returns a stable local collaborator identity from localStorage, or creates a new
 * persistent identity if one does not exist.
 *
 * NOTE: Must ONLY be called on the client after mount (e.g. inside useEffect)
 * to avoid hydration mismatches between server and client markup.
 */
export function getOrCreateLocalUser(): SessionUser {
  if (typeof window === "undefined") {
    // Deterministic fallback for non-browser environments; never generate random values on SSR
    return {
      id: "anonymous",
      name: "Anonymous",
      color: "#4F46E5",
      initials: "AN",
      role: "Editor",
    };
  }

  try {
    const cached =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEY) ||
      window.sessionStorage.getItem(LEGACY_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as SessionUser;
      if (parsed.name && parsed.color && parsed.initials && parsed.id) {
        // Ensure migrated or cached identity is saved under the active localStorage key
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        } catch {
          // Ignore storage write failure
        }
        return parsed;
      }
    }
  } catch {
    // localStorage unavailable or restricted
  }

  // Generate a random realistic identity for this user
  const nameIndex = Math.floor(Math.random() * REALISTIC_NAMES.length);
  const colorIndex = Math.floor(Math.random() * COLLAB_COLORS.length);
  const name = REALISTIC_NAMES[nameIndex];
  const color = COLLAB_COLORS[colorIndex];
  const initials = getInitials(name);
  const id = "user_" + Math.random().toString(36).substring(2, 9);

  const newUser: SessionUser = {
    id,
    name,
    color,
    initials,
    role: "Editor",
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  } catch {
    // Ignore storage write failure
  }

  return newUser;
}

/**
 * Alias for getOrCreateLocalUser for backward compatibility.
 */
export function getOrCreateSessionUser(): SessionUser {
  return getOrCreateLocalUser();
}

/**
 * Updates the stored local collaborator identity with an authenticated user's real name and avatar color.
 */
export function updateLocalUserIdentity(name: string, color?: string): SessionUser {
  const current = getOrCreateLocalUser();
  const trimmed = name.trim();
  const updated: SessionUser = {
    ...current,
    name: trimmed || current.name,
    initials: trimmed ? getInitials(trimmed) : current.initials,
    color: color || current.color,
  };

  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore storage write failure
  }

  return updated;
}

/**
 * Clears the stored user identity upon sign out.
 */
export function clearLocalUser(): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    // Ignore storage write failure
  }
}


