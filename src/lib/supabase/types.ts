export type DocumentRole = 'owner' | 'editor' | 'viewer';

export type Profile = {
  id: string; // references auth.users(id)
  display_name: string;
  avatar_color: string;
  created_at: string;
};

export type DocumentMetadata = {
  id: string; // document slug or uuid
  title: string;
  owner_id: string; // references auth.users(id)
  is_link_editable: boolean;
  created_at: string;
  updated_at: string;
};

export type DocumentMemberRow = {
  id: string;
  document_id: string;
  user_id: string;
  role: DocumentRole;
  created_at: string;
};

export type DocumentMember = DocumentMemberRow & {
  profile?: Profile;
};

export type DocumentWithMembers = DocumentMetadata & {
  document_members?: DocumentMember[];
  collaborators?: Profile[];
  currentUserRole?: DocumentRole;
  isOwner?: boolean;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          display_name: string;
          avatar_color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_color?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: DocumentMetadata;
        Insert: {
          id: string;
          title?: string;
          owner_id: string;
          is_link_editable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          owner_id?: string;
          is_link_editable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_members: {
        Row: DocumentMemberRow;
        Insert: {
          id?: string;
          document_id: string;
          user_id: string;
          role: DocumentRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          user_id?: string;
          role?: DocumentRole;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

