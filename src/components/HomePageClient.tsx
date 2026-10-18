"use client";

import React, { useState, useEffect, useMemo, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Hero, type SortOption } from "@/components/Hero";
import { PromptGallery } from "@/components/PromptGallery";
import { Footer } from "@/components/Footer";
import {
  STARTER_PROMPTS,
  type AIModel,
  type PromptItem,
} from "@/data/prompts";
import { createClient } from "@/lib/supabase/client";
import { getUserBookmarkedPromptIds } from "@/app/actions/bookmarks";

const PAGE_SIZE = 8;

interface HomePageClientProps {
  initialPrompts?: PromptItem[];
  initialTotalMatching?: number;
  initialSource?: "database" | "local";
}

export function HomePageClient({
  initialPrompts,
  initialTotalMatching,
}: HomePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [bookmarkedPromptIds, setBookmarkedPromptIds] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsAuthenticated(true);
        getUserBookmarkedPromptIds().then((ids) => {
          setBookmarkedPromptIds(ids);
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        getUserBookmarkedPromptIds().then((ids) => {
          setBookmarkedPromptIds(ids);
        });
      } else {
        setBookmarkedPromptIds([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  // Controlled Style Facets
  const occasion = searchParams.get("occasion") || "all";
  const setting = searchParams.get("setting") || "all";
  const lighting = searchParams.get("lighting") || "all";
  const framing = searchParams.get("framing") || "all";
  const workflow = searchParams.get("workflow") || "all";

  // Single URL Updater for all filters, facets, search, sort, and pagination
  const updateUrl = useCallback(
    (params: {
      q?: string;
      category?: string;
      model?: string;
      sort?: SortOption;
      page?: number;
      occasion?: string;
      setting?: string;
      lighting?: string;
      framing?: string;
      workflow?: string;
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

      if (params.occasion !== undefined) {
        if (params.occasion && params.occasion !== "all") {
          current.set("occasion", params.occasion);
        } else {
          current.delete("occasion");
        }
      }

      if (params.setting !== undefined) {
        if (params.setting && params.setting !== "all") {
          current.set("setting", params.setting);
        } else {
          current.delete("setting");
        }
      }

      if (params.lighting !== undefined) {
        if (params.lighting && params.lighting !== "all") {
          current.set("lighting", params.lighting);
        } else {
          current.delete("lighting");
        }
      }

      if (params.framing !== undefined) {
        if (params.framing && params.framing !== "all") {
          current.set("framing", params.framing);
        } else {
          current.delete("framing");
        }
      }

      if (params.workflow !== undefined) {
        if (params.workflow && params.workflow !== "all") {
          current.set("workflow", params.workflow);
        } else {
          current.delete("workflow");
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

  // Client-side fallback computation when initialPrompts is not provided
  const fallbackFilteredPrompts = useMemo(() => {
    if (initialPrompts !== undefined) return null;

    const filtered = STARTER_PROMPTS.filter((prompt) => {
      if (selectedCategory !== "all" && prompt.category !== selectedCategory) {
        return false;
      }

      if (selectedModel !== "All Models") {
        const matchesPrimary = prompt.model === selectedModel;
        const matchesCompatible = prompt.compatibleModels?.includes(
          selectedModel as AIModel
        );
        if (!matchesPrimary && !matchesCompatible) {
          return false;
        }
      }

      if (occasion !== "all" && prompt.occasion !== occasion) return false;
      if (setting !== "all" && prompt.setting !== setting) return false;
      if (lighting !== "all" && prompt.lighting !== lighting) return false;
      if (framing !== "all" && prompt.framing !== framing) return false;
      if (workflow !== "all" && prompt.workflow !== workflow) return false;

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

    return filtered.sort((a, b) => {
      if (sortOption === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortOption === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [
    initialPrompts,
    searchQuery,
    selectedCategory,
    selectedModel,
    sortOption,
    occasion,
    setting,
    lighting,
    framing,
    workflow,
  ]);

  const displayedPrompts = useMemo(() => {
    if (initialPrompts !== undefined) {
      return initialPrompts;
    }
    if (fallbackFilteredPrompts) {
      const start = (currentPage - 1) * PAGE_SIZE;
      return fallbackFilteredPrompts.slice(start, start + PAGE_SIZE);
    }
    return [];
  }, [initialPrompts, fallbackFilteredPrompts, currentPage]);

  const totalMatching =
    initialTotalMatching !== undefined
      ? initialTotalMatching
      : fallbackFilteredPrompts?.length || 0;

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

  const handleSelectOccasion = (val: string) => {
    updateUrl({ occasion: val, page: 1 });
  };

  const handleSelectSetting = (val: string) => {
    updateUrl({ setting: val, page: 1 });
  };

  const handleSelectLighting = (val: string) => {
    updateUrl({ lighting: val, page: 1 });
  };

  const handleSelectFraming = (val: string) => {
    updateUrl({ framing: val, page: 1 });
  };

  const handleSelectWorkflow = (val: string) => {
    updateUrl({ workflow: val, page: 1 });
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

  const handleRemoveOccasion = () => {
    updateUrl({ occasion: "all", page: 1 });
  };

  const handleRemoveSetting = () => {
    updateUrl({ setting: "all", page: 1 });
  };

  const handleRemoveLighting = () => {
    updateUrl({ lighting: "all", page: 1 });
  };

  const handleRemoveFraming = () => {
    updateUrl({ framing: "all", page: 1 });
  };

  const handleRemoveWorkflow = () => {
    updateUrl({ workflow: "all", page: 1 });
  };

  const handleApplyMobileFilters = (filters: {
    model: string;
    category: string;
    occasion: string;
    setting: string;
    lighting: string;
    framing: string;
    workflow: string;
  }) => {
    updateUrl({
      model: filters.model,
      category: filters.category,
      occasion: filters.occasion,
      setting: filters.setting,
      lighting: filters.lighting,
      framing: filters.framing,
      workflow: filters.workflow,
      page: 1,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section with Search, Sort, Facets & Mobile Drawer */}
        <Hero
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          sortOption={sortOption}
          onSortChange={handleSortChange}
          occasion={occasion}
          onSelectOccasion={handleSelectOccasion}
          setting={setting}
          onSelectSetting={handleSelectSetting}
          lighting={lighting}
          onSelectLighting={handleSelectLighting}
          framing={framing}
          onSelectFraming={handleSelectFraming}
          workflow={workflow}
          onSelectWorkflow={handleSelectWorkflow}
          onResetFilters={handleResetFilters}
          onRemoveSearch={handleRemoveSearch}
          onRemoveCategory={handleRemoveCategory}
          onRemoveModel={handleRemoveModel}
          onRemoveOccasion={handleRemoveOccasion}
          onRemoveSetting={handleRemoveSetting}
          onRemoveLighting={handleRemoveLighting}
          onRemoveFraming={handleRemoveFraming}
          onRemoveWorkflow={handleRemoveWorkflow}
          onApplyMobileFilters={handleApplyMobileFilters}
          totalResults={totalMatching}
        />

        {/* Masonry-Style Prompt Gallery with pagination & empty state */}
        <PromptGallery
          prompts={displayedPrompts}
          totalMatching={totalMatching}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
          onResetFilters={handleResetFilters}
          returnQuery={searchParams.toString() ? `/?${searchParams.toString()}` : "/#gallery"}
          bookmarkedPromptIds={bookmarkedPromptIds}
          isAuthenticated={isAuthenticated}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
