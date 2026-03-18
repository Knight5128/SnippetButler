export interface Snippet {
  id: string;
  content: string;
  tags: string[]; // parsed from raw text
  folderId: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  isTodo: boolean;
  isDone: boolean;
  isArchived: boolean;
  archivedAt: number | null;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Tag {
  name: string;
  createdAt: number;
}

