"use client";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { PromptGallery } from "@/components/PromptGallery";
import { Footer } from "@/components/Footer";
import { STARTER_PROMPTS } from "@/data/prompts";

export function HomePageClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedModel, setSelectedModel] = useState("All Models");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter prompts based on search, category, and model
  const filteredPrompts = useMemo(() => {
    return STARTER_PROMPTS.filter((prompt) => {
      // Category filter
      if (selectedCategory !== "all" && prompt.category !== selectedCategory) {
        return false;
      }

      // Model filter
      if (selectedModel !== "All Models" && prompt.model !== selectedModel) {
        return false;
      }

      // Search filter (searches title, prompt text, and tags)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = prompt.title.toLowerCase().includes(query);
        const matchesPrompt = prompt.prompt.toLowerCase().includes(query);
        const matchesTags = prompt.tags.some((tag) =>
          tag.toLowerCase().includes(query)
        );
        const matchesModel = prompt.model.toLowerCase().includes(query);

        if (!matchesTitle && !matchesPrompt && !matchesTags && !matchesModel) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedModel]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedModel("All Models");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section with Search & Filters */}
        <Hero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onResetFilters={handleResetFilters}
          totalResults={filteredPrompts.length}
        />

        {/* Masonry-Style Prompt Gallery */}
        <PromptGallery
          prompts={filteredPrompts}
          onResetFilters={handleResetFilters}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
