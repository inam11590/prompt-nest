import type { PromptItem } from "@/data/prompts";

export type CollectionVisibility = "PRIVATE" | "PUBLIC";

export interface Collection {
  id: string;
  publicId: string;
  userId: string;
  title: string;
  description: string | null;
  visibility: CollectionVisibility;
  concurrencyVersion: number;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  promptId: string;
  position: number;
  createdAt: string;
  prompt?: PromptItem;
}

export interface CollectionWithItems extends Collection {
  items: CollectionItem[];
}

export interface PublicCollectionOwner {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface PublicCollection {
  id: string;
  publicId: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC";
  createdAt: string;
  updatedAt: string;
  owner: PublicCollectionOwner | null; // null if creator profile is private/inactive
  items: CollectionItem[];
}
