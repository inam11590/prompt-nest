export interface NavItem {
  label: string;
  href: string;
  iconName: "Home" | "Compass" | "Sparkles" | "BookOpen" | "Info";
  isPrimary?: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  url: string;
  ogImage: string;
  navItems: NavItem[];
  categories: CategoryItem[];
  footerLinks: {
    product: { label: string; href: string }[];
    resources: { label: string; href: string }[];
    legal: { label: string; href: string }[];
  };
  socialLinks: {
    github: string;
    twitter: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "PromptNest",
  shortName: "PromptNest",
  tagline: "The Visual AI Prompt Discovery Engine",
  description:
    "Discover, inspect, and copy tested AI prompts for Midjourney, DALL-E, Stable Diffusion, and Flux. Curated for artists, designers, and prompt engineers.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og-image.jpg",
  navItems: [
    { label: "Home", href: "/", iconName: "Home", isPrimary: true },
    { label: "Explore", href: "/#gallery", iconName: "Compass" },
    { label: "Creators", href: "/creators", iconName: "Sparkles" },
    { label: "Models", href: "/#models", iconName: "Sparkles" },
    { label: "Guides", href: "/blog", iconName: "BookOpen" },
    { label: "About", href: "/#about", iconName: "Info" },
  ],
  categories: [
    { id: "all", name: "All Prompts", slug: "all", description: "Browse all curated prompts" },
    { id: "photography", name: "Photography", slug: "photography", description: "Portraits, film styles, street photography, and real-world optics" },
    { id: "digital-art", name: "Digital Art", slug: "digital-art", description: "Concept art, sci-fi illustrations, and matte paintings" },
    { id: "architecture", name: "Architecture", slug: "architecture", description: "Modern interiors, brutalist facades, and organic structures" },
    { id: "character-design", name: "Characters", slug: "character-design", description: "Stylized characters, heroic figures, and expressive expressions" },
    { id: "nature", name: "Nature & Landscapes", slug: "nature", description: "Dramatic weather, atmospheric environments, and pristine wilderness" },
    { id: "graphic-design", name: "Graphic & UI", slug: "graphic-design", description: "Isometric renders, packaging, 3D icons, and clean layouts" },
  ],
  footerLinks: {
    product: [
      { label: "Prompt Library", href: "/#gallery" },
      { label: "AI Models", href: "/#models" },
      { label: "Categories", href: "/#categories" },
    ],
    resources: [
      { label: "Guides & Tutorials", href: "/blog" },
      { label: "Image Attribution", href: "/#attribution" },
      { label: "Roadmap", href: "/#roadmap" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/#privacy" },
      { label: "Terms of Service", href: "/#terms" },
      { label: "Open Source Notice", href: "/#licenses" },
    ],
  },
  socialLinks: {
    github: "https://github.com",
    twitter: "https://x.com",
  },
};
