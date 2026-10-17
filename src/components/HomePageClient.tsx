"use client";

import React, { useMemo, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Hero, type SortOption } from "@/components/Hero";
import { PromptGallery } from "@/components/PromptGallery";
import { Footer } from "@/components/Footer";
import { STARTER_PROMPTS, type AIModel } from "@/data/prompts";

const PAGE_SIZE = 8;

export function HomePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Directly derive state from URL search params (Single Source of Truth, fully shareable)
  const searchQuery = searchParams.get("q") || "";
  const selectedCategory = searchParams.get("category") || "all";
  const selectedModel = searchParams.get("model") || "All Models";
  const rawSort = searchParams.get("sort") as SortOption;
  const sortOption: SortOption = ["newest", "title-asc", "title-desc"].includes(rawSort)
    ? rawSort
    : "newest";
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = rawPage > 0 ? rawPage : 1;

  // Single URL Updater
  const updateUrl = useCallback(
    (params: {
      q?: string;
      category?: string;
      model?: string;
      sort?: SortOption;
      page?: number;
    }) => {
      const current = new URLSearchParams(searchParams.toString());

      if (params.q !== undefined) {
        if (params.q.trim()) {
          current.set("q", params.q.trim());
        } else {
          current.delete("q");
        }
      }

      if (params.category !== undefined) {
        if (params.category && params.category !== "all") {
          current.set("category", params.category);
        } else {
          current.delete("category");
        }
      }

      if (params.model !== undefined) {
        if (params.model && params.model !== "All Models") {
          current.set("model", params.model);
        } else {
          current.delete("model");
        }
      }

      if (params.sort !== undefined) {
        if (params.sort && params.sort !== "newest") {
          current.set("sort", params.sort);
        } else {
          current.delete("sort");
        }
      }

      if (params.page !== undefined) {
        if (params.page > 1) {
          current.set("page", params.page.toString());
        } else {
          current.delete("page");
        }
      }

      const queryStr = current.toString();
      const newPath = queryStr ? `/?${queryStr}` : "/";

      startTransition(() => {
        router.push(newPath, { scroll: false });
      });
    },
    [searchParams, router]
  );

  // Filter and Sort Prompts
  const filteredAndSortedPrompts = useMemo(() => {
    // 1. Filter
    const filtered = STARTER_PROMPTS.filter((prompt) => {
      // Category filter
      if (selectedCategory !== "all" && prompt.category !== selectedCategory) {
        return false;
      }

      // Model filter
      if (selectedModel !== "All Models") {
        const matchesPrimary = prompt.model === selectedModel;
        const matchesCompatible = prompt.compatibleModels?.includes(
          selectedModel as AIModel
        );
        if (!matchesPrimary && !matchesCompatible) {
          return false;
        }
      }

      // Search filter across title, prompt text, description, tags, and model
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = prompt.title.toLowerCase().includes(query);
        const matchesDesc = prompt.shortDescription.toLowerCase().includes(query);
        const matchesPrompt = prompt.prompt.toLowerCase().includes(query);
        const matchesTags = prompt.tags.some((tag) =>
          tag.toLowerCase().includes(query)
        );
        const matchesModel = prompt.model.toLowerCase().includes(query);

        if (!matchesTitle && !matchesDesc && !matchesPrompt && !matchesTags && !matchesModel) {
          return false;
        }
      }

      return true;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      if (sortOption === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortOption === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      // "newest" sort by publication date
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [searchQuery, selectedCategory, selectedModel, sortOption]);

  const totalMatching = filteredAndSortedPrompts.length;
  const paginatedPrompts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedPrompts.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedPrompts, currentPage]);

  // Handlers
  const handleSearchChange = (val: string) => {
    updateUrl({ q: val, page: 1 });
  };

  const handleSelectCategory = (cat: string) => {
    updateUrl({ category: cat, page: 1 });
  };

  const handleSelectModel = (model: string) => {
    updateUrl({ model: model, page: 1 });
  };

  const handleSortChange = (sort: SortOption) => {
    updateUrl({ sort: sort });
  };

  const handlePageChange = (page: number) => {
    updateUrl({ page: page });
    const galleryEl = document.getElementById("gallery");
    if (galleryEl) {
      galleryEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleResetFilters = () => {
    startTransition(() => {
      router.push("/", { scroll: false });
    });
  };

  const handleRemoveSearch = () => {
    updateUrl({ q: "", page: 1 });
  };

  const handleRemoveCategory = () => {
    updateUrl({ category: "all", page: 1 });
  };

  const handleRemoveModel = () => {
    updateUrl({ model: "All Models", page: 1 });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section with Search, Sort & Filters */}
        <Hero
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          sortOption={sortOption}
          onSortChange={handleSortChange}
          onResetFilters={handleResetFilters}
          onRemoveSearch={handleRemoveSearch}
          onRemoveCategory={handleRemoveCategory}
          onRemoveModel={handleRemoveModel}
          totalResults={totalMatching}
        />

        {/* Masonry-Style Prompt Gallery with pagination */}
        <PromptGallery
          prompts={paginatedPrompts}
          totalMatching={totalMatching}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
          onResetFilters={handleResetFilters}
          returnQuery={searchParams.toString() ? `/?${searchParams.toString()}` : "/#gallery"}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
