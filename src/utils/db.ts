import { invoke } from "@tauri-apps/api/core";
import type { Folder, Snippet, Tag } from "../types";

interface RawSnippet {
  id: string;
  content: string;
  tags: string;
  folder_id: string | null;
  is_pinned: boolean;
  is_favorite: boolean;
  is_todo: boolean;
  is_done: boolean;
  is_archived: boolean;
  archived_at: number | null;
  deleted_at: number | null;
  created_at: number;
  updated_at: number;
}

interface RawFolder {
  id: string;
  name: string;
  created_at: number;
}

interface RawTag {
  name: string;
  created_at: number;
}

export async function fetchSnippets(): Promise<Snippet[]> {
  const raw = (await invoke("list_snippets")) as RawSnippet[];
  return raw.map((s) => ({
    id: s.id,
    content: s.content,
    tags: s.tags ? s.tags.split(",").filter(Boolean) : [],
    folderId: s.folder_id,
    isPinned: s.is_pinned,
    isFavorite: s.is_favorite,
    isTodo: s.is_todo,
    isDone: s.is_done,
    isArchived: s.is_archived,
    archivedAt: s.archived_at,
    deletedAt: s.deleted_at,
    createdAt: s.created_at,
    updatedAt: s.updated_at
  }));
}

export async function saveSnippet(snippet: Snippet): Promise<void> {
  const payload = {
    id: snippet.id,
    content: snippet.content,
    tags: snippet.tags.join(","),
    folder_id: snippet.folderId,
    is_pinned: snippet.isPinned,
    is_favorite: snippet.isFavorite,
    is_todo: snippet.isTodo,
    is_done: snippet.isDone,
    is_archived: snippet.isArchived,
    archived_at: snippet.archivedAt,
    deleted_at: snippet.deletedAt,
    created_at: snippet.createdAt,
    updated_at: snippet.updatedAt
  };

  await invoke("upsert_snippet", { snippet: payload });
}

export async function removeSnippet(id: string): Promise<void> {
  await invoke("delete_snippet", { id });
}

export async function fetchFolders(): Promise<Folder[]> {
  const raw = (await invoke("list_folders")) as RawFolder[];
  return raw.map((folder) => ({
    id: folder.id,
    name: folder.name,
    createdAt: folder.created_at
  }));
}

export async function saveFolder(folder: Folder): Promise<void> {
  await invoke("upsert_folder", {
    folder: {
      id: folder.id,
      name: folder.name,
      created_at: folder.createdAt
    }
  });
}

export async function removeFolder(id: string): Promise<void> {
  await invoke("delete_folder", { id });
}

export async function fetchTags(): Promise<Tag[]> {
  const raw = (await invoke("list_tags")) as RawTag[];
  return raw.map((tag) => ({
    name: tag.name,
    createdAt: tag.created_at
  }));
}

export async function saveTag(tag: Tag): Promise<void> {
  await invoke("upsert_tag", {
    tag: {
      name: tag.name,
      created_at: tag.createdAt
    }
  });
}

