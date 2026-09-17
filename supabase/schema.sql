-- ==============================================================================
-- SolarDocs Supabase Schema: Anonymous Auth, Profiles & Document Metadata
-- ==============================================================================
-- IMPORTANT ARCHITECTURAL RULES:
-- 1. Store only document metadata, ownership, and sharing permissions here.
-- 2. Do NOT store TipTap text changes, Yjs updates, cursors, selections, or
--    online presence as database rows. Yjs handles all real-time editing & CRDTs.
-- ==============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Profiles Table
-- Stores temporary or persistent profile for each authenticated/anonymous visitor.
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_color text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. Documents Table
-- Metadata only: ID, title, owner ID, created time, updated time, share setting.
-- ------------------------------------------------------------------------------
create table if not exists public.documents (
  id text primary key,
  title text not null default 'Untitled Document',
  owner_id uuid not null references auth.users(id) on delete cascade,
  is_link_editable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for querying documents by owner
create index if not exists idx_documents_owner_id on public.documents(owner_id);

-- Enable RLS for documents
alter table public.documents enable row level security;

-- ------------------------------------------------------------------------------
-- 3. Document Members Table
-- Sharing permissions: document ID, user ID, role ('owner', 'editor', 'viewer').
-- ------------------------------------------------------------------------------
create table if not exists public.document_members (
  id uuid primary key default gen_random_uuid(),
  document_id text not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (document_id, user_id)
);

-- Indexes for fast membership lookups
create index if not exists idx_document_members_doc_user on public.document_members(document_id, user_id);
create index if not exists idx_document_members_user_id on public.document_members(user_id);

-- Enable RLS for document members
alter table public.document_members enable row level security;

-- ------------------------------------------------------------------------------
-- Helper Security Definer Functions
-- Avoids infinite recursion in RLS policies between documents and document_members
-- ------------------------------------------------------------------------------
create or replace function public.is_document_member(doc_id text, check_uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.document_members
    where document_id = doc_id and user_id = check_uid
  );
$$;

create or replace function public.can_edit_document(doc_id text, check_uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.documents
    where id = doc_id and (owner_id = check_uid or is_link_editable = true)
  )
  or exists (
    select 1 from public.document_members
    where document_id = doc_id and user_id = check_uid and role in ('owner', 'editor')
  );
$$;

-- ------------------------------------------------------------------------------
-- Documents Row-Level Security Policies
-- Users can access documents they own, are members of, or are link-shared
-- ------------------------------------------------------------------------------
create policy "Users can view documents they own, are members of, or have link access"
  on public.documents for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.is_document_member(id, auth.uid())
    or is_link_editable = true
  );

create policy "Users can create their own documents"
  on public.documents for insert
  to authenticated
  with check (
    owner_id = auth.uid()
  );

create policy "Owners, editors, and link-shared users can update document metadata"
  on public.documents for update
  to authenticated
  using (
    public.can_edit_document(id, auth.uid())
  )
  with check (
    public.can_edit_document(id, auth.uid())
  );

create policy "Only document owners can delete documents"
  on public.documents for delete
  to authenticated
  using (
    owner_id = auth.uid()
  );

-- ------------------------------------------------------------------------------
-- Document Members Row-Level Security Policies
-- ------------------------------------------------------------------------------
create policy "Members can view membership of documents they have access to"
  on public.document_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.documents d
      where d.id = document_members.document_id and d.owner_id = auth.uid()
    )
  );

create policy "Document owners, self, or link-shared documents can add document membership"
  on public.document_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.documents d
      where d.id = document_members.document_id and (d.owner_id = auth.uid() or d.is_link_editable = true)
    )
  );

create policy "Document owners can update membership roles"
  on public.document_members for update
  to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_members.document_id and d.owner_id = auth.uid()
    )
  );

create policy "Document owners can remove members or users can remove themselves"
  on public.document_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.documents d
      where d.id = document_members.document_id and d.owner_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- Automatic updated_at trigger for documents
-- ------------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger tr_documents_updated_at
  before update on public.documents
  for each row
  execute function public.handle_updated_at();
