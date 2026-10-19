import type { PromptItem } from "@/data/prompts";

export type CollectionVisibility = "PRIVATE" | "PUBLIC";

export interface Collection {
  id: string;
  publicId: string;
  slug?: string;
  userId: string;
  title: string;
  name?: string;
  description: string | null;
  visibility: CollectionVisibility;
  isPublic?: boolean;
  concurrencyVersion: number;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  itemsCount?: number;
  coverImageUrls?: string[];
  tags?: string[];
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
  slug?: string;
  title: string;
  name?: string;
  description: string | null;
  visibility: "PUBLIC";
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
  owner: PublicCollectionOwner | null; // null if creator profile is private/inactive
  items: CollectionItem[];
  itemsCount?: number;
  coverImageUrls?: string[];
  tags?: string[];
}
