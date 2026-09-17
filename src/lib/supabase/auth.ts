import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from './client';
import type { Profile } from './types';
import type { SessionUser } from '../collaboration-user';

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

