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

/**
 * Returns a temporary session user.
 * Persists strictly within the browser tab's sessionStorage (temporary only, no database).
 */
export function getOrCreateSessionUser(): SessionUser {
  if (typeof window === "undefined") {
    return {
      id: "server-session",
      name: "Anonymous",
      color: "#4F46E5",
      initials: "AN",
      role: "Editor",
    };
  }

  const STORAGE_KEY = "solardocs_session_user";
  try {
    const cached = window.sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as SessionUser;
      if (parsed.name && parsed.color && parsed.initials) {
        return parsed;
      }
    }
  } catch {
    // sessionStorage unavailable or restricted
  }

  // Generate a random realistic identity
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
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  } catch {
    // Ignore storage write failure
  }

  return newUser;
}
