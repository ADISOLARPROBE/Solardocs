import type { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './client';
import type { Profile } from './types';
import { SessionUser, updateLocalUserIdentity, clearLocalUser } from '../collaboration-user';

export interface AuthResult {
  user: User | null;
  session?: Session | null;
  error: string | null;
}

/**
 * Signs in an existing user with email and password.
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      user: null,
      error: 'Supabase credentials are not configured in your environment. You can continue as Guest to explore the workspace.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      // Sync profile name to local collaboration identity
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const realName =
          profile?.display_name ||
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          email.split('@')[0];

        const avatarColor = profile?.avatar_color;
        updateLocalUserIdentity(realName, avatarColor);
      } catch {
        // Fallback to email username if profile fetch fails
        updateLocalUserIdentity(email.split('@')[0]);
      }
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign in.';
    return { user: null, error: message };
  }
}

/**
 * Signs up a new user with full name, email, and password.
 */
export async function signUpWithEmail(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      user: null,
      error: 'Supabase credentials are not configured in your environment. You can continue as Guest to explore the workspace.',
    };
  }

  try {
    const trimmedName = name.trim();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: trimmedName,
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      // Upsert profile for new user
      try {
        await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              display_name: trimmedName,
              avatar_color: '#4F46E5',
            },
            { onConflict: 'id' }
          );
      } catch (err) {
        console.warn('[SolarDocs Auth] Error saving profile during signup:', err);
      }

      // Update local collaboration identity
      updateLocalUserIdentity(trimmedName, '#4F46E5');
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign up.';
    return { user: null, error: message };
  }
}

/**
 * Signs out the current user and clears local collaboration storage.
 */
export async function signOutUser(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[SolarDocs Auth] Sign out error:', err);
    }
  }
  clearLocalUser();
}

/**
 * Returns the currently authenticated non-anonymous user, or null if unauthenticated.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) return null;
    if (data.session.user.is_anonymous) return null;
    return data.session.user;
  } catch {
    return null;
  }
}

/**
 * Ensures the visitor has an active Supabase session via anonymous sign-in.
 * Returns the authenticated User or null if Supabase is unconfigured or offline.
 */
export async function ensureAnonymousSession(): Promise<User | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    // Check if session already exists in local storage / memory
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (!sessionError && sessionData?.session?.user) {
      return sessionData.session.user;
    }

    // Sign in anonymously
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('[SolarDocs Auth] Supabase anonymous sign-in warning:', error.message);
      return null;
    }

    return data.user;
  } catch (err) {
    console.warn('[SolarDocs Auth] Failed to ensure anonymous session:', err);
    return null;
  }
}

/**
 * Synchronizes the visitor's profile in the `profiles` table using the exact
 * display name and avatar color used for Yjs presence.
 */
export async function syncUserProfile(
  supabaseUser: User,
  sessionUser: SessionUser
): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: supabaseUser.id,
          display_name: sessionUser.name,
          avatar_color: sessionUser.color,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      console.warn('[SolarDocs Auth] Failed to sync profile with Supabase:', error.message);
      return null;
    }

    return data as Profile;
  } catch (err) {
    console.warn('[SolarDocs Auth] Profile upsert error:', err);
    return null;
  }
}

/**
 * Fetches the user profile by user ID.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return null;
    }

    return data as Profile;
  } catch {
    return null;
  }
}


