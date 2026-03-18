import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type { Folder, Snippet, Tag } from "../types";
import { extractTags } from "../utils/tags";
import {
  fetchFolders,
  fetchSnippets,
  fetchTags,
  removeFolder,
  removeSnippet,
  saveFolder,
  saveTag,
  saveSnippet
} from "../utils/db";

export type FilterMode = "all" | "todo" | "favorite";
const ARCHIVE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

interface SnippetState {
  snippets: Snippet[];
  folders: Folder[];
  tags: Tag[];
  activeFolderId: string | null;
  activeTag: string | null;
  filterMode: FilterMode;
  loading: boolean;
  init: () => Promise<void>;
  setFilterMode: (mode: FilterMode) => void;
  setActiveTag: (tag: string | null) => void;
  setActiveFolderId: (id: string | null) => void;
  addSnippetFromText: (content: string) => Promise<void>;
  updateSnippet: (snippet: Snippet) => Promise<void>;
  archiveSnippet: (id: string) => Promise<void>;
  unarchiveSnippet: (id: string) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  restoreSnippet: (id: string) => Promise<void>;
  permanentlyDeleteSnippet: (id: string) => Promise<void>;
  toggleFlag: (id: string, key: "isPinned" | "isFavorite" | "isTodo" | "isDone") => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  createTag: (name: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

function normalizeTagName(name: string): string {
  return name.trim().replace(/^#+/, "").toLowerCase();
}

function mergeTags(existingTags: Tag[], tagNames: string[]): Tag[] {
  if (tagNames.length === 0) {
    return existingTags;
  }

  const known = new Set(existingTags.map((tag) => tag.name));
  const additions = tagNames
    .map(normalizeTagName)
    .filter((name) => name && !known.has(name))
    .map((name) => ({
      name,
      createdAt: Date.now()
    }));

  return additions.length > 0 ? [...existingTags, ...additions] : existingTags;
}

function normalizeSnippetLifecycle(snippet: Snippet): Snippet {
  if (snippet.deletedAt !== null) {
    return {
      ...snippet,
      isArchived: false,
      archivedAt: null
    };
  }

  if (snippet.isArchived) {
    return {
      ...snippet,
      archivedAt: snippet.archivedAt ?? snippet.updatedAt
    };
  }

  return {
    ...snippet,
    archivedAt: null,
    deletedAt: null
  };
}

export const useSnippetStore = create<SnippetState>((set, get) => ({
  snippets: [],
  folders: [],
  tags: [],
  activeFolderId: null,
  activeTag: null,
  filterMode: "all",
  loading: false,

  init: async () => {
    set({ loading: true });
    const [snippets, folders, tags] = await Promise.all([
      fetchSnippets(),
      fetchFolders(),
      fetchTags()
    ]);
    const now = Date.now();
    const expiredArchivedIds = snippets
      .filter(
        (snippet) =>
          snippet.isArchived &&
          snippet.deletedAt === null &&
          snippet.archivedAt !== null &&
          now - snippet.archivedAt >= ARCHIVE_RETENTION_MS
      )
      .map((snippet) => snippet.id);

    if (expiredArchivedIds.length > 0) {
      await Promise.all(expiredArchivedIds.map((id) => removeSnippet(id)));
    }

    set({
      snippets: snippets
        .filter((snippet) => !expiredArchivedIds.includes(snippet.id))
        .map(normalizeSnippetLifecycle),
      folders,
      tags,
      loading: false
    });
  },

  setFilterMode: (mode) => set({ filterMode: mode }),
  setActiveTag: (tag) => set({ activeTag: tag }),
  setActiveFolderId: (id) => set({ activeFolderId: id }),

  addSnippetFromText: async (content: string) => {
    const tags = extractTags(content);
    const now = Date.now();
    const snippet: Snippet = {
      id: uuid(),
      content,
      tags,
      folderId: get().activeFolderId,
      isPinned: false,
      isFavorite: false,
      isTodo: false,
      isDone: false,
      isArchived: false,
      archivedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now
    };

    await saveSnippet(snippet);
    set((state) => ({
      snippets: [snippet, ...state.snippets],
      tags: mergeTags(state.tags, tags)
    }));
  },

  updateSnippet: async (snippet) => {
    const tags = extractTags(snippet.content);
    const updated = normalizeSnippetLifecycle({
      ...snippet,
      tags,
      updatedAt: Date.now()
    });
    await saveSnippet(updated);
    set((state) => ({
      snippets: state.snippets.map((s) => (s.id === updated.id ? updated : s)),
      tags: mergeTags(state.tags, tags)
    }));
  },

  archiveSnippet: async (id) => {
    const target = get().snippets.find((s) => s.id === id);
    if (!target) return;

    const updated = normalizeSnippetLifecycle({
      ...target,
      isArchived: true,
      archivedAt: Date.now(),
      deletedAt: null,
      updatedAt: Date.now()
    });

    await saveSnippet(updated);
    set((state) => ({
      snippets: state.snippets.map((s) => (s.id === id ? updated : s))
    }));
  },

  unarchiveSnippet: async (id) => {
    const target = get().snippets.find((s) => s.id === id);
    if (!target) return;

    const updated = normalizeSnippetLifecycle({
      ...target,
      isArchived: false,
      archivedAt: null,
      deletedAt: null,
      updatedAt: Date.now()
    });

    await saveSnippet(updated);
    set((state) => ({
      snippets: state.snippets.map((s) => (s.id === id ? updated : s))
    }));
  },

  deleteSnippet: async (id) => {
    const target = get().snippets.find((s) => s.id === id);
    if (!target) return;

    const updated = normalizeSnippetLifecycle({
      ...target,
      isArchived: false,
      deletedAt: Date.now(),
      updatedAt: Date.now()
    });

    await saveSnippet(updated);
    set((state) => ({
      snippets: state.snippets.map((s) => (s.id === id ? updated : s))
    }));
  },

  restoreSnippet: async (id) => {
    const target = get().snippets.find((s) => s.id === id);
    if (!target) return;

    const updated = normalizeSnippetLifecycle({
      ...target,
      isArchived: false,
      deletedAt: null,
      updatedAt: Date.now()
    });

    await saveSnippet(updated);
    set((state) => ({
      snippets: state.snippets.map((s) => (s.id === id ? updated : s))
    }));
  },

  permanentlyDeleteSnippet: async (id) => {
    await removeSnippet(id);
    set((state) => ({
      snippets: state.snippets.filter((s) => s.id !== id)
    }));
  },

  toggleFlag: async (id, key) => {
    const target = get().snippets.find((s) => s.id === id);
    if (!target) return;
    const updated: Snippet = { ...target, [key]: !target[key], updatedAt: Date.now() };
    await saveSnippet(updated);
    set((state) => ({
      snippets: state.snippets.map((s) => (s.id === id ? updated : s))
    }));
  },

  createFolder: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const duplicate = get().folders.some(
      (folder) => folder.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) return;

    const folder: Folder = { id: uuid(), name: trimmed, createdAt: Date.now() };
    await saveFolder(folder);
    set((state) => ({ folders: [...state.folders, folder] }));
  },

  createTag: async (name) => {
    const normalized = normalizeTagName(name);
    if (!normalized) return;

    const duplicate = get().tags.some((tag) => tag.name === normalized);
    if (duplicate) return;

    const tag: Tag = { name: normalized, createdAt: Date.now() };
    await saveTag(tag);
    set((state) => ({ tags: [...state.tags, tag] }));
  },

  renameFolder: async (id, name) => {
    const existing = get().folders.find((f) => f.id === id);
    if (!existing) return;
    const updated: Folder = { ...existing, name };
    await saveFolder(updated);
    set((state) => ({
      folders: state.folders.map((f) => (f.id === id ? updated : f))
    }));
  },

  deleteFolder: async (id) => {
    await removeFolder(id);
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      snippets: state.snippets.map((s) =>
        s.folderId === id ? { ...s, folderId: null } : s
      )
    }));
  }
}));

