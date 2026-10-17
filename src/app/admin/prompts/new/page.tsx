import React from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { PromptEditorForm } from "@/components/admin/PromptEditorForm";

export const metadata: Metadata = {
  title: `New Prompt — Admin Console — ${siteConfig.name}`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewPromptPage() {
  return <PromptEditorForm mode="create" />;
}
