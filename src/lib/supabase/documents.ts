import { getSupabaseClient } from './client';
import type {
  DocumentMetadata,
  DocumentMember,
  DocumentRole,
  DocumentWithMembers,
  Profile,
} from './types';

/**
 * Generates a clean, unique document identifier slug.
 */
export function generateDocumentId(): string {
  return `doc-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a brand new document row with a generated ID, title 'Untitled document',
 * current user as owner, and an owner record in document_members.
 */
export async function createDocument(
  ownerId: string,
  initialTitle: string = 'Untitled document'
): Promise<DocumentMetadata | null> {
  const supabase = getSupabaseClient();
  const documentId = generateDocumentId();

  if (!supabase) {
    // If Supabase is unconfigured, return a valid local fallback object
    return {
      id: documentId,
      title: initialTitle,
      owner_id: ownerId,
      is_link_editable: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  try {
    // 1. Insert into documents table
    const { data: newDoc, error: insertError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        title: initialTitle,
        owner_id: ownerId,
        is_link_editable: false,
      })
      .select()
      .single();

    if (insertError) {
      console.warn('[SolarDocs Supabase] Error creating new document:', insertError.message);
      return null;
    }

    // 2. Insert owner record in document_members
    await supabase.from('document_members').insert({
      document_id: documentId,
      user_id: ownerId,
      role: 'owner',
    });

    return newDoc as DocumentMetadata;
  } catch (err) {
    console.warn('[SolarDocs Supabase] Failed to create document:', err);
    return null;
  }
}

/**
 * Fetches document metadata from Supabase by document ID.
 * Returns null if Supabase is unconfigured, document not found, or inaccessible.
 */
export async function getDocumentMetadata(documentId: string): Promise<DocumentMetadata | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .maybeSingle();

    if (error) {
      console.warn('[SolarDocs Supabase] Error fetching document metadata:', error.message);
      return null;
    }

    return data as DocumentMetadata | null;
  } catch (err) {
    console.warn('[SolarDocs Supabase] Failed to fetch document metadata:', err);
    return null;
  }
}

/**
 * Retrieves existing document metadata or creates a new document row with the owner.
 * Also registers the owner (or joins as editor if link-shared) into `document_members`.
 */
export async function getOrCreateDocument(
  documentId: string,
  initialTitle: string,
  userId: string
): Promise<DocumentMetadata | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    // 1. Try to find existing document
    const existing = await getDocumentMetadata(documentId);
    if (existing) {
      // If user is not the owner and document is link-editable, enroll them as editor
      if (existing.owner_id !== userId && existing.is_link_editable) {
        await supabase.from('document_members').upsert(
          {
            document_id: documentId,
            user_id: userId,
            role: 'editor' as DocumentRole,
          },
          { onConflict: 'document_id,user_id' }
        );
      }
      return existing;
    }

    // 2. Insert new document metadata
    const { data: newDoc, error: insertError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        title: initialTitle,
        owner_id: userId,
        is_link_editable: false,
      })
      .select()
      .single();

    if (insertError) {
      // If another client created it concurrently, attempt fetch again
      const retry = await getDocumentMetadata(documentId);
      if (retry) {
        return retry;
      }
      console.warn('[SolarDocs Supabase] Error creating document:', insertError.message);
      return null;
    }

    // 3. Register the owner in document_members table
    await supabase.from('document_members').upsert(
      {
        document_id: documentId,
        user_id: userId,
        role: 'owner' as DocumentRole,
      },
      { onConflict: 'document_id,user_id' }
    );

    return newDoc as DocumentMetadata;
  } catch (err) {
    console.warn('[SolarDocs Supabase] Failed in getOrCreateDocument:', err);
    return null;
  }
}

/**
 * Updates the document title in Supabase.
 */
export async function updateDocumentTitle(documentId: string, title: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('documents')
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (error) {
      console.warn('[SolarDocs Supabase] Error updating document title:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[SolarDocs Supabase] Failed to update document title:', err);
    return false;
  }
}

/**
 * Updates the "Anyone with the link can edit" share setting in Supabase.
 */
export async function updateDocumentShareSetting(
  documentId: string,
  isLinkEditable: boolean
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('documents')
      .update({
        is_link_editable: isLinkEditable,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (error) {
      console.warn('[SolarDocs Supabase] Error updating share setting:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[SolarDocs Supabase] Failed to update share setting:', err);
    return false;
  }
}

/**
 * Fetches all documents accessible to the given user (owned or member of).
 * Enriched with collaborator profiles and role metadata for the dashboard workspace.
 */
export async function getUserDocuments(userId: string): Promise<DocumentWithMembers[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return [];
  }

  try {
    // With RLS enabled, select(*) returns only documents the user owns or belongs to
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('*, document_members(*, profile:profiles(*))')
      .order('updated_at', { ascending: false });

    if (docsError) {
      console.warn('[SolarDocs Supabase] Error fetching user documents:', docsError.message);
      return [];
    }

    if (!docs) {
      return [];
    }

    return (docs as unknown as Array<DocumentMetadata & {
      document_members?: Array<DocumentMember & { profile?: Profile }>;
    }>).map((doc) => {
      const members = doc.document_members || [];
      const userMember = members.find((m) => m.user_id === userId);
      const isOwner = doc.owner_id === userId;

      const collaborators: Profile[] = [];
      members.forEach((m) => {
        if (m.profile) {
          collaborators.push(m.profile);
        }
      });

      return {
        ...doc,
        document_members: members,
        collaborators,
        isOwner,
        currentUserRole: isOwner ? 'owner' : (userMember?.role || 'editor'),
      };
    });
  } catch (err) {
    console.warn('[SolarDocs Supabase] Failed in getUserDocuments:', err);
    return [];
  }
}

/**
 * Fetches members of a document with their profile information.
 */
export async function getDocumentMembers(documentId: string): Promise<DocumentMember[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('document_members')
      .select('*, profile:profiles(*)')
      .eq('document_id', documentId);

    if (error) {
      console.warn('[SolarDocs Supabase] Error fetching document members:', error.message);
      return [];
    }

    return (data as unknown as DocumentMember[]) || [];
  } catch (err) {
    console.warn('[SolarDocs Supabase] Failed to get document members:', err);
    return [];
  }
}

/**
 * Adds or updates a document member's role.
 */
export async function addOrUpdateDocumentMember(
  documentId: string,
  userId: string,
  role: DocumentRole
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase.from('document_members').upsert(
      {
        document_id: documentId,
        user_id: userId,
        role,
      },
      { onConflict: 'document_id,user_id' }
    );

    if (error) {
      console.warn('[SolarDocs Supabase] Error adding document member:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[SolarDocs Supabase] Failed to add document member:', err);
    return false;
  }
}

