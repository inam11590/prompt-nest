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
    { label: "Trending", href: "/trending", iconName: "Sparkles" },
    { label: "Collections", href: "/collections", iconName: "Compass" },
    { label: "Creators", href: "/creators", iconName: "Sparkles" },
    { label: "Models", href: "/#models", iconName: "Sparkles" },
    { label: "Guides", href: "/blog", iconName: "BookOpen" },
    { label: "About", href: "/#about", iconName: "Info" },
  ],
  categories: [
    { id: "all", name: "All Prompts", slug: "all", description: "Browse all curated prompts" },
    { id: "portraits", name: "Portraits", slug: "portraits", description: "Studio lighting, candid natural emotion, diverse character studies, and cinematic portraiture" },
    { id: "nature", name: "Nature & Landscapes", slug: "nature", description: "Dramatic weather, atmospheric environments, mountains, and pristine wilderness" },
    { id: "architecture", name: "Architecture & Interiors", slug: "architecture", description: "Modern interiors, brutalist facades, organic structures, and sustainable villas" },
    { id: "food-product", name: "Food & Product", slug: "food-product", description: "Culinary styling, luxury product design, macro textures, and studio commercial lighting" },
    { id: "fashion-cinematic", name: "Fashion & Cinematic", slug: "fashion-cinematic", description: "Editorial couture, mood lighting, film stills, and avant-garde aesthetic scenes" },
    { id: "sports-portraits", name: "Cricket & Sports", slug: "sports-portraits", description: "Dynamic sports action, cricket power-hitting, athletics, and stadium floodlight lighting" },
    { id: "cinematic-portraits", name: "Cinematic Portraits", slug: "cinematic-portraits", description: "Dramatic chiaroscuro studio lighting, moody film noir, and cinematic 35mm character studies" },
    { id: "editorial-portraits", name: "Professional Editorial", slug: "editorial-portraits", description: "Forbes-style executive headshots, creative studio portraits, and artisan workspaces" },
    { id: "streetwear-fashion", name: "Streetwear & Fashion", slug: "streetwear-fashion", description: "Urban high-fashion, Tokyo streetwear, retro vintage styling, and modern couture" },
    { id: "outdoor-travel", name: "Outdoor & Travel", slug: "outdoor-travel", description: "Epic travel landscapes, desert adventures, mountain climbs, and world wanderlust" },
    { id: "photography", name: "Photography", slug: "photography", description: "Film styles, 35mm grain, street photography, and real-world optics" },
    { id: "digital-art", name: "Digital Art", slug: "digital-art", description: "Concept art, sci-fi illustrations, and matte paintings" },
    { id: "character-design", name: "Characters", slug: "character-design", description: "Stylized characters, heroic figures, and expressive expressions" },
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
