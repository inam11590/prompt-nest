export type AIModel =
  | "Midjourney v6.1"
  | "DALL-E 3"
  | "FLUX.1 [dev]"
  | "Stable Diffusion XL"
  | "ChatGPT-4o";

export type PromptCategory =
  | "photography"
  | "digital-art"
  | "architecture"
  | "character-design"
  | "nature"
  | "graphic-design"
  | "portraits"
  | "food-product"
  | "fashion-cinematic"
  | "sports-portraits"
  | "cinematic-portraits"
  | "editorial-portraits"
  | "streetwear-fashion"
  | "outdoor-travel";

export type StyleOccasion =
  | "professional"
  | "casual"
  | "sports"
  | "fashion"
  | "cinematic";

export type StyleSetting =
  | "studio"
  | "outdoor"
  | "urban"
  | "stadium"
  | "indoor";

export type StyleLighting =
  | "natural"
  | "soft_studio"
  | "dramatic"
  | "neon"
  | "golden_hour";

export type StyleFraming =
  | "close_up"
  | "upper_body"
  | "full_body";

export type StyleWorkflow =
  | "personal_photo_only"
  | "personal_photo_plus_example";

export const STYLE_FACETS = {
  occasion: {
    key: "occasion",
    label: "Occasion",
    options: [
      { id: "professional", label: "Professional" },
      { id: "casual", label: "Casual" },
      { id: "sports", label: "Sports" },
      { id: "fashion", label: "Fashion" },
      { id: "cinematic", label: "Cinematic" },
    ],
  },
  setting: {
    key: "setting",
    label: "Setting",
    options: [
      { id: "studio", label: "Studio" },
      { id: "outdoor", label: "Outdoor" },
      { id: "urban", label: "Urban" },
      { id: "stadium", label: "Stadium" },
      { id: "indoor", label: "Indoor" },
    ],
  },
  lighting: {
    key: "lighting",
    label: "Lighting",
    options: [
      { id: "natural", label: "Natural Daylight" },
      { id: "soft_studio", label: "Soft Studio" },
      { id: "dramatic", label: "Dramatic" },
      { id: "neon", label: "Neon" },
      { id: "golden_hour", label: "Golden Hour" },
    ],
  },
  framing: {
    key: "framing",
    label: "Framing",
    options: [
      { id: "close_up", label: "Close-Up" },
      { id: "upper_body", label: "Upper Body" },
      { id: "full_body", label: "Full Body" },
    ],
  },
  workflow: {
    key: "workflow",
    label: "Workflow",
    options: [
      { id: "personal_photo_only", label: "Photo Only (Mode A)" },
      { id: "personal_photo_plus_example", label: "Photo + Ref (Mode B)" },
    ],
  },
} as const;

export interface PromptVariable {
  key: string;
  label: string;
  defaultValue: string;
  options: string[];
}

export interface PromptItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  prompt: string;
  promptDual?: string; // "Use my photo + example" dual-reference prompt variant
  category: PromptCategory;
  model: AIModel;
  compatibleModels: AIModel[];
  tags: string[];
  imageUrl: string;
  imageAlt: string;
  width: number;
  height: number;
  aspectRatio: "portrait" | "landscape" | "square";
  aspectRatioValue: string; // e.g. "4/5", "3/4", "16/9", "1/1"
  dominantColor: string; // for reserving space and smooth loading without layout shift
  publishedAt: string; // ISO 8601 publication date
  published?: boolean; // publication boolean flag
  status?: "draft" | "published" | "archived"; // publication lifecycle state
  updatedAt?: string; // ISO 8601 timestamp for concurrency checks
  negativePrompt?: string; // Optional: only present when explicitly stored
  referenceImageUrl?: string; // Step 13: Optional reference input image for img2img / before-after comparison
  variables?: PromptVariable[]; // Step 13: Optional customizable prompt variables
  viewsCount?: number; // Step 14: Atomic views counter
  copiesCount?: number; // Step 14: Atomic copies counter
  likesCount?: number; // Step 14: Atomic likes counter
  savesCount?: number; // Step 14: Atomic saves/bookmarks counter
  generationParameters?: Record<string, string | number>; // Optional generation params
  sourceAttribution: {
    source: string;
    author: string;
    authorUrl: string;
    license: string;
  };
  importKey?: string; // Stable idempotent import identifier
  sourceType?: "midjourney" | "unsplash" | "curated" | "user"; // Source origin
  promptType?: "original" | "recreation"; // 'original' generation prompt vs 'recreation' prompt
  assetStatus?: "READY" | "DRAFT_PENDING_ASSET"; // Asset readiness state
  imageProvenance?: {
    source?: string;
    license?: string;
    author?: string;
    authorUrl?: string;
    permissionEvidence?: string;
    originalPromptSupplied?: boolean;
    dimensions?: { width: number; height: number };
  };
  authorId?: string; // Optional creator user ID
  author?: {
    username: string;
    displayName: string | null;
    avatarUrl?: string | null;
  };
  // Step 11: Controlled Style Facets for Portrait Discovery
  occasion?: StyleOccasion;
  setting?: StyleSetting;
  lighting?: StyleLighting;
  framing?: StyleFraming;
  workflow?: StyleWorkflow;
}

import { PUBLISHED_STEP10_PROMPTS } from "./revisedStep10Prompts";
import rawPersonalTransformationPrompts from "./personalTransformationPrompts.json";

const ORIGINAL_STARTER_PROMPTS: PromptItem[] = [
  {
    id: "prompt-1",
    slug: "cinematic-35mm-tokyo-dusk-portrait",
    title: "Cinematic 35mm Street Portrait in Tokyo Dusk",
    shortDescription: "Candid twilight street portrait with rich 35mm film grain, Kodachrome tones, and neon reflections.",
    prompt:
      "A candid cinematic street portrait of a woman standing beneath neon signs on a rainy Tokyo avenue at twilight. Shot on 35mm film, Kodachrome color grading, gentle rain reflections on asphalt, shallow depth of field, f/1.4 aperture, subtle film grain, natural evening illumination, realistic skin textures, 8k resolution.",
    category: "photography",
    model: "Midjourney v6.1",
    compatibleModels: ["Midjourney v6.1", "FLUX.1 [dev]", "Stable Diffusion XL"],
    tags: ["35mm", "street-photography", "neon", "tokyo", "cinematic", "kodachrome"],
    imageUrl:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Atmospheric street portrait lit by vivid evening city lights",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
    negativePrompt:
      "text, watermark, logo, signage, blurry, distorted face, duplicate limbs, extra fingers, bad anatomy, overexposed",
    width: 900,
    height: 1200,
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#1a162b",
    publishedAt: "2024-08-15T09:00:00Z",
    sourceAttribution: {
      source: "Unsplash",
      author: "Alex Knight",
      authorUrl: "https://unsplash.com/@agk42",
      license: "Unsplash Free License",
    },
    occasion: "cinematic",
    setting: "urban",
    lighting: "neon",
    framing: "close_up",
    workflow: "personal_photo_only",
    viewsCount: 8420,
    copiesCount: 680,
    likesCount: 490,
    savesCount: 310,
  },
  {
    id: "prompt-2",
    slug: "biophilic-sustainable-modern-villa",
    title: "Biophilic Sustainable Modern Villa with Hanging Gardens",
    shortDescription: "Minimalist concrete and timber architectural residence harmonized with lush hillside flora.",
    prompt:
      "Modern minimalist architectural exterior of a sustainable concrete and timber residence nestled on a hillside. Cascading native flora, large floor-to-ceiling glass pavilions, warm interior ambient lights, peaceful reflection pool, overcast soft daylight, architectural photography, Hasselblad H6D-100c, tilt-shift lens.",
    category: "architecture",
    model: "FLUX.1 [dev]",
    compatibleModels: ["FLUX.1 [dev]", "Midjourney v6.1", "DALL-E 3"],
    tags: ["architecture", "sustainable", "minimalism", "biophilic", "tilt-shift"],
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Contemporary luxury architecture integrated seamlessly with lush greenery",
    negativePrompt:
      "people, crowd, cars, power lines, construction waste, text, logo, blurry, oversaturated, gloomy, cloudy",
    width: 900,
    height: 675,
    aspectRatio: "landscape",
    aspectRatioValue: "4/3",
    dominantColor: "#2c3327",
    publishedAt: "2024-08-20T14:30:00Z",
    sourceAttribution: {
      source: "Unsplash",
      author: "R Architecture",
      authorUrl: "https://unsplash.com/@rarchitecture_melbourne",
      license: "Unsplash Free License",
    },
    viewsCount: 4210,
    copiesCount: 340,
    likesCount: 280,
    savesCount: 190,
  },
  {
    id: "prompt-3",
    slug: "celestial-cyberpunk-nomad-character",
    title: "Celestial Cyberpunk Nomad Character Design",
    shortDescription: "Heroic concept illustration of a high-tech desert wanderer with holographic visor and scavenger armor.",
    prompt:
      "Stylized character design illustration of a celestial desert nomad wearing high-tech scavenger armor crafted from weathered ceramics and copper alloy. Flowing linen hooded cloak, glowing holographic visor, intricate mechanical gauntlet, dramatic sunset rim lighting, concept art trending on ArtStation, Octane render.",
    category: "character-design",
    model: "Midjourney v6.1",
    compatibleModels: ["Midjourney v6.1", "Stable Diffusion XL"],
    tags: ["character-design", "concept-art", "cyberpunk", "sci-fi", "holographic"],
    imageUrl:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Futuristic warrior concept portrait with dramatic lighting",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80",
    negativePrompt:
      "text, watermark, logo, cartoonish, low polygon, blurry face, bad anatomy, deformed hands, low resolution",
    width: 900,
    height: 1200,
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#24181f",
    publishedAt: "2024-09-01T11:15:00Z",
    sourceAttribution: {
      source: "Unsplash",
      author: "Avel Chuklanov",
      authorUrl: "https://unsplash.com/@chuklanov",
      license: "Unsplash Free License",
    },
    viewsCount: 6320,
    copiesCount: 510,
    likesCount: 390,
    savesCount: 260,
  },
  {
    id: "prompt-4",
    slug: "mystic-pine-forest-volumetric-fog",
    title: "Mystic Pine Forest in Volumetric Morning Fog",
    shortDescription: "Dramatic alpine wilderness enveloped in morning mist with sharp sun rays filtering through conifers.",
    prompt:
      "Aerial low-angle landscape of ancient evergreen pine trees emerging through thick morning mist in the Pacific Northwest mountains. God rays piercing damp atmosphere, deep emerald and charcoal tones, damp mossy boulders, crisp cool autumn breeze feeling, National Geographic photography style, high dynamic range.",
    category: "nature",
    model: "Stable Diffusion XL",
    compatibleModels: ["Stable Diffusion XL", "FLUX.1 [dev]", "Midjourney v6.1"],
    tags: ["nature", "landscape", "fog", "pine-trees", "volumetric-light", "mountains"],
    imageUrl:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Lush misty pine forest under diffused morning sunlight",
    width: 900,
    height: 562,
    aspectRatio: "landscape",
    aspectRatioValue: "16/10",
    dominantColor: "#1b2923",
    publishedAt: "2024-09-08T08:00:00Z",
    sourceAttribution: {
      source: "Unsplash",
      author: "Sebastian Unrau",
      authorUrl: "https://unsplash.com/@sebastian_unrau",
      license: "Unsplash Free License",
    },
    viewsCount: 3180,
    copiesCount: 220,
    likesCount: 190,
    savesCount: 110,
  },
  {
    id: "prompt-5",
    slug: "minimalist-isometric-glassmorphism-workspace",
    title: "Minimalist Isometric Workspace 3D Glassmorphism Render",
    shortDescription: "Translucent frosted 3D workstation featuring clean clay shaders, soft lighting, and bonsai tree.",
    prompt:
      "A clean isometric 3D render of a futuristic creative desk workspace. Translucent frosted glass desk, miniature potted bonsai, holographic mechanical keyboard, ceramic espresso mug, soft pastel studio gradient backdrop, clay material and octane shaders, soft ambient occlusion, sleek modern aesthetic.",
    category: "graphic-design",
    model: "DALL-E 3",
    compatibleModels: ["DALL-E 3", "Midjourney v6.1", "ChatGPT-4o"],
    tags: ["isometric", "3d-render", "glassmorphism", "octane", "workspace", "minimalist"],
    imageUrl:
      "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Minimalist workspace setup with clean aesthetics and warm lighting",
    width: 900,
    height: 675,
    aspectRatio: "landscape",
    aspectRatioValue: "4/3",
    dominantColor: "#2a2829",
    publishedAt: "2024-09-12T16:45:00Z",
    sourceAttribution: {
      source: "Unsplash",
      author: "Howard Bouchevereau",
      authorUrl: "https://unsplash.com/@howardbouchevereau",
      license: "Unsplash Free License",
    },
    viewsCount: 5490,
    copiesCount: 430,
    likesCount: 330,
    savesCount: 210,
  },
  {
    id: "prompt-6",
    slug: "surreal-floating-botanical-island",
    title: "Surreal Floating Botanical Island Concept Art",
    shortDescription: "Gravity-defying floating garden island with weeping willows and waterfalls spilling into sunset clouds.",
    prompt:
      "Digital matte painting of a gravity-defying floating island with ancient weeping willow trees, crystal waterfalls spilling into ethereal clouds below. Bioluminescent butterflies, soft golden sunset horizon, whimsical fantasy environment, Moebius and Studio Ghibli inspired color palette, painterly brushwork.",
    category: "digital-art",
    model: "Midjourney v6.1",
    compatibleModels: ["Midjourney v6.1", "FLUX.1 [dev]", "Stable Diffusion XL"],
    tags: ["fantasy", "concept-art", "floating-island", "matte-painting", "ghibli"],
    imageUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Whimsical fantasy landscape with ethereal light and dramatic clouds",
    width: 900,
    height: 1200,
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#201826",
    publishedAt: "2024-09-18T10:20:00Z",
    sourceAttribution: {
      source: "Unsplash",
      author: "Kalen Emsley",
      authorUrl: "https://unsplash.com/@kalenemsley",
      license: "Unsplash Free License",
    },
    viewsCount: 2890,
    copiesCount: 190,
    likesCount: 145,
    savesCount: 95,
  },
  {
    id: "prompt-7",
    slug: "haute-couture-prismatic-studio-portrait",
    title: "High-Fashion Haute Couture Studio Portrait with Prismatic Light",
    shortDescription: "Sculptural pleated organza editorial portrait split by refractive prism glass rainbow flares.",
    prompt:
      "Editorial studio fashion photography of a model wearing an avant-garde sculptural garment made of reflective pleated organza. Creative prism glass lens refraction, vibrant magenta and amber rainbow highlights across the cheekbones, sharp contrast, Leica SL2, 90mm f/2 Summicron lens, Vogue cover aesthetic.",
    category: "photography",
    model: "FLUX.1 [dev]",
    compatibleModels: ["FLUX.1 [dev]", "Midjourney v6.1"],
    tags: ["fashion", "editorial", "studio", "prismatic", "leica", "avant-garde"],
    imageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
    imageAlt: "High-contrast editorial portrait with elegant artistic lighting",
    width: 900,
    height: 1200,
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#312028",
    publishedAt: "2024-09-24T13:00:00Z",
    sourceAttribution: {
      source: "Unsplash",
      author: "Aiony Haust",
      authorUrl: "https://unsplash.com/@aiony",
      license: "Unsplash Free License",
    },
    occasion: "fashion",
    setting: "studio",
    lighting: "dramatic",
    framing: "upper_body",
    workflow: "personal_photo_only",
    viewsCount: 7120,
    copiesCount: 590,
    likesCount: 420,
    savesCount: 280,
  },
  {
    id: "prompt-8",
    slug: "brutalist-concrete-museum-atrium",
    title: "Brutalist Concrete Museum Atrium with Dramatic Skylight",
    shortDescription: "Geometric spiral staircase and curved raw concrete illuminated by a single diagonal sunbeam.",
    prompt:
      "Monolithic brutalist museum interior featuring curved raw board-formed concrete walls, massive geometric spiral staircase, and an oculus skylight casting a sharp diagonal beam of sun across polished terrazzo flooring. Quiet contemplative atmosphere, architectural minimalism, black and white tone, high dynamic range.",
    category: "architecture",
    model: "Stable Diffusion XL",
    compatibleModels: ["Stable Diffusion XL", "FLUX.1 [dev]", "Midjourney v6.1"],
    tags: ["brutalism", "concrete", "interior", "oculus", "architecture", "monochrome"],
    imageUrl:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Dramatic architectural interior with concrete textures and strong geometric shadows",
    width: 900,
    height: 1200,
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#222222",
    publishedAt: "2024-09-29T18:10:00Z",
    sourceAttribution: {
      source: "Unsplash",
      author: "Danist Soh",
      authorUrl: "https://unsplash.com/@danistsoh",
      license: "Unsplash Free License",
    },
    viewsCount: 3840,
    copiesCount: 270,
    likesCount: 210,
    savesCount: 130,
  },
  {
    id: "prompt-9",
    slug: "cybernetic-android-pilot-luminescent-sensors",
    title: "Cybernetic Android Pilot with Luminescent Optic Sensors",
    shortDescription: "Matte porcelain synthetic mecha pilot with cyan ocular optics and intricate neck servos.",
    prompt:
      "Intricate portrait of an android mecha pilot. Translucent matte porcelain synthetic skull with visible fiber-optic conduits beneath, calm human-like expressions, luminescent cyan ocular rings, titanium neck servos, depth of field, Ray-traced cinematic lighting, Unreal Engine 5 render, character concept.",
    category: "character-design",
    model: "Midjourney v6.1",
    compatibleModels: ["Midjourney v6.1", "FLUX.1 [dev]", "DALL-E 3"],
    tags: ["android", "mecha", "cybernetics", "unreal-engine", "sci-fi", "futurism"],
    imageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Sleek cybernetic character portrait with luminous futuristic accents",
    width: 900,
    height: 1200,
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#172336",
    publishedAt: "2024-10-02T12:00:00Z",
    sourceAttribution: {
      source: "Unsplash",
      author: "Milad Fakurian",
      authorUrl: "https://unsplash.com/@fakurian",
      license: "Unsplash Free License",
    },
    occasion: "cinematic",
    setting: "studio",
    lighting: "neon",
    framing: "close_up",
    workflow: "personal_photo_only",
    viewsCount: 4950,
    copiesCount: 380,
    likesCount: 290,
    savesCount: 185,
  },
  {
    id: "prompt-10",
    slug: "nordic-fjord-mirror-water-reflections",
    title: "Sun-Drenched Nordic Fjord with Mirror Water Reflections",
    shortDescription: "Panoramic golden hour fjord with sheer snow-dusted cliffs, rorbu cabin, and glassy water.",
    prompt:
      "Panoramic vista of a dramatic Norwegian fjord during golden hour. Steep granite cliffs draped in light snow, glassy still emerald water reflecting the crimson sky, small red wooden rorbu cabin on the shoreline, crisp arctic atmosphere, Sony A7R V with 24-70mm GM lens, pristine clarity.",
    category: "nature",
    model: "FLUX.1 [dev]",
    compatibleModels: ["FLUX.1 [dev]", "Midjourney v6.1", "Stable Diffusion XL"],
    tags: ["norway", "fjord", "reflections", "golden-hour", "landscape", "arctic"],
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Serene natural shoreline with calm water reflecting radiant skies",
    width: 900,
    height: 506,
    aspectRatio: "landscape",
    aspectRatioValue: "16/9",
    dominantColor: "#1d2938",
    publishedAt: "2024-10-05T07:40:00Z",
    sourceAttribution: {
      source: "Unsplash",
      author: "Sean Oulashin",
      authorUrl: "https://unsplash.com/@oulashin",
      license: "Unsplash Free License",
    },
    viewsCount: 3420,
    copiesCount: 240,
    likesCount: 175,
    savesCount: 115,
  },
  {
    id: "prompt-11",
    slug: "abstract-kinetic-liquid-chrome-typography",
    title: "Abstract Kinetic Liquid Chrome Typography Poster",
    shortDescription: "Swiss-inspired editorial poster with molten mercury letterforms and iridescent reflections.",
    prompt:
      "Modern graphic design poster featuring molten liquid chrome 3D abstract letterforms melting over a textured off-white background. Iridescent mercury reflections, Swiss typographic layout with tight modern sans-serif subtitles, museum exhibition print, cinema 4D and Redshift render.",
    category: "graphic-design",
    model: "DALL-E 3",
    compatibleModels: ["DALL-E 3", "Midjourney v6.1", "ChatGPT-4o"],
    tags: ["graphic-design", "typography", "liquid-chrome", "poster", "swiss-style", "iridescent"],
    imageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Bold modern liquid metallic typography composition",
    width: 900,
    height: 1200,
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#1d1f24",
    publishedAt: "2024-10-10T15:20:00Z",
    sourceAttribution: {
      source: "Unsplash",
      author: "Milad Fakurian",
      authorUrl: "https://unsplash.com/@fakurian",
      license: "Unsplash Free License",
    },
    viewsCount: 5810,
    copiesCount: 460,
    likesCount: 360,
    savesCount: 230,
  },
  {
    id: "prompt-12",
    slug: "subterranean-crystal-cavern-bioluminescent-river",
    title: "Subterranean Crystal Cavern with Bioluminescent River",
    shortDescription: "Colossal underground amethyst geodes with glowing turquoise river and floating spore particles.",
    prompt:
      "Deep underground cavern glowing with colossal amethyst and fluorite crystal clusters. An electric turquoise subterranean river flowing smoothly through ancient stalagmites, glowing spore particles floating in the humid air, wide-angle cinematic shot, high fantasy matte painting, masterwork.",
    category: "digital-art",
    model: "ChatGPT-4o",
    compatibleModels: ["ChatGPT-4o", "DALL-E 3", "Midjourney v6.1"],
    tags: ["crystals", "cavern", "bioluminescence", "fantasy", "digital-art", "subterranean"],
    imageUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Ethereal luminous cave glowing with rich mineral crystal formations",
    width: 900,
    height: 1200,
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#1d142d",
    publishedAt: "2024-10-14T20:00:00Z",
    sourceAttribution: {
      source: "Unsplash",
      author: "Kalen Emsley",
      authorUrl: "https://unsplash.com/@kalenemsley",
      license: "Unsplash Free License",
    },
    viewsCount: 6940,
    copiesCount: 540,
    likesCount: 410,
    savesCount: 275,
  },
];

export const STARTER_PROMPTS: PromptItem[] = [
  ...ORIGINAL_STARTER_PROMPTS,
  ...PUBLISHED_STEP10_PROMPTS,
];

export function getPromptBySlug(slug: string): PromptItem | undefined {
  return (
    STARTER_PROMPTS.find((p) => p.slug === slug) ||
    (rawPersonalTransformationPrompts as unknown as PromptItem[]).find((p) => p.slug === slug)
  );
}

/**
 * Returns all published prompt slugs for static route generation and sitemaps.
 */
export function getAllPromptSlugs(): string[] {
  return STARTER_PROMPTS.map((p) => p.slug);
}

/**
 * Deterministically ranks and selects related prompts for a given prompt:
 * - Excludes the current prompt
 * - Primary weight: Shared category (+10 points)
 * - Secondary weight: Shared tags (+3 points each)
 * - Tertiary weight: Compatible AI models overlap (+2 points each)
 * - Stable tie-breaker: Newest publishedAt date, followed by title comparison
 * - Returns at most `limit` unique prompts (default: 6)
 * - Returns empty array if no relevance threshold is met (> 0 points)
 */
export function getRelatedPrompts(currentPrompt: PromptItem, limit = 6): PromptItem[] {
  const scored = STARTER_PROMPTS
    .filter(
      (p) =>
        p.slug !== currentPrompt.slug &&
        p.id !== currentPrompt.id &&
        p.published !== false &&
        p.status !== "draft" &&
        p.assetStatus !== "DRAFT_PENDING_ASSET"
    )
    .map((candidate) => {
      let score = 0;

      // 1. Category match (highest priority signal)
      if (candidate.category === currentPrompt.category) {
        score += 10;
      }

      // 2. Shared style facets (Step 11 portrait discovery)
      if (currentPrompt.occasion && candidate.occasion === currentPrompt.occasion) {
        score += 6;
      }
      if (currentPrompt.setting && candidate.setting === currentPrompt.setting) {
        score += 5;
      }
      if (currentPrompt.lighting && candidate.lighting === currentPrompt.lighting) {
        score += 4;
      }
      if (currentPrompt.framing && candidate.framing === currentPrompt.framing) {
        score += 3;
      }
      if (currentPrompt.workflow && candidate.workflow === currentPrompt.workflow) {
        score += 3;
      }

      // 3. Shared tags match
      const currentTags = new Set(currentPrompt.tags.map((t) => t.toLowerCase()));
      const sharedTagsCount = candidate.tags.filter((t) =>
        currentTags.has(t.toLowerCase())
      ).length;
      score += sharedTagsCount * 2;

      // 4. Compatible AI model overlap
      const currentModels = new Set([
        currentPrompt.model,
        ...(currentPrompt.compatibleModels || []),
      ]);
      const candidateModels = [
        candidate.model,
        ...(candidate.compatibleModels || []),
      ];
      const modelOverlap = candidateModels.filter((m) => currentModels.has(m)).length;
      score += modelOverlap * 1;

      return { candidate, score };
    })
    .filter((item) => item.score > 0);

  // Sort deterministically: highest score first, then newest publication date, then title alphabetical
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const dateDiff =
      new Date(b.candidate.publishedAt).getTime() -
      new Date(a.candidate.publishedAt).getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return a.candidate.title.localeCompare(b.candidate.title);
  });

  return scored.slice(0, limit).map((item) => item.candidate);
}

/**
 * Step 13: Deterministically extracts customizable variables from a prompt.
 * If prompt.variables is set, returns it.
 * Otherwise detects [bracketed_variables] in the prompt text,
 * plus the universal Aspect Ratio, Lighting Style, Camera Lens, and AI Model Format controls.
 */
export function extractPromptVariables(prompt: PromptItem): PromptVariable[] {
  if (prompt.variables && prompt.variables.length > 0) {
    return prompt.variables;
  }

  const variables: PromptVariable[] = [];

  // Check for any [bracketed variable] in the prompt text
  const bracketMatches = prompt.prompt.match(/\[([a-zA-Z0-9_\-\s]+)\]/g);
  if (bracketMatches) {
    const seen = new Set<string>();
    for (const match of bracketMatches) {
      const inner = match.slice(1, -1).trim();
      const key = inner.toLowerCase().replace(/\s+/g, "_");
      if (!seen.has(key)) {
        seen.add(key);
        variables.push({
          key,
          label: inner.charAt(0).toUpperCase() + inner.slice(1),
          defaultValue: inner,
          options: [inner],
        });
      }
    }
  }

  // Universal customizable variable controls
  // 1. Aspect Ratio
  const defaultAr =
    prompt.aspectRatioValue === "3/4" ||
    prompt.aspectRatioValue === "4/5" ||
    prompt.aspectRatio === "portrait"
      ? "9:16"
      : prompt.aspectRatioValue === "4/3" ||
        prompt.aspectRatioValue === "16/9" ||
        prompt.aspectRatio === "landscape"
      ? "16:9"
      : "1:1";

  variables.push({
    key: "aspectRatio",
    label: "Aspect Ratio",
    defaultValue: defaultAr,
    options: ["9:16", "2:3", "4:5", "1:1", "16:9"],
  });

  // 2. Lighting Style
  variables.push({
    key: "lightingStyle",
    label: "Lighting Style",
    defaultValue: "Default",
    options: [
      "Default",
      "Golden Hour",
      "Crisp Studio Daylight",
      "Moody Cinematic Neon",
      "Soft Diffused Overcast",
    ],
  });

  // 3. Camera Lens
  variables.push({
    key: "cameraLens",
    label: "Camera Lens",
    defaultValue: "Default",
    options: [
      "Default",
      "35mm Editorial",
      "50mm Prime",
      "85mm f/1.4 Portrait",
      "24mm Wide Angle",
    ],
  });

  // 4. Model Format
  variables.push({
    key: "modelFormat",
    label: "AI Model Format",
    defaultValue: prompt.model.includes("Midjourney")
      ? "Midjourney v6.1"
      : prompt.model.includes("FLUX")
      ? "FLUX.1 Pro"
      : "Raw Prompt",
    options: [
      "Midjourney v6.1",
      "FLUX.1 Pro",
      "DALL-E 3",
      "Raw Prompt",
    ],
  });

  return variables;
}

export interface NegativePromptData {
  rawNegativeText: string;
  exclusionPills: string[];
  midjourneyNoSyntax: string;
}

/**
 * Step 13: Deterministically extracts negative prompt exclusions, pills, and Midjourney --no syntax.
 */
export function extractNegativePromptData(prompt: PromptItem): NegativePromptData {
  let raw = prompt.negativePrompt?.trim() || "";

  // If not explicitly set, scan for trailing negative sentence in prompt text
  if (!raw) {
    const negativeMatch = prompt.prompt.match(/(?:(?:no|without|avoid|exclude)\s+[^.]+?)(?:\.|$)/i);
    if (negativeMatch) {
      raw = negativeMatch[0].replace(/\.$/, "").trim();
    }
  }

  // Fallback high-fidelity exclusions if none found
  if (!raw) {
    raw = "text, watermark, logo, blurry, distorted hands, bad anatomy, extra limbs, low resolution";
  }

  // Clean raw tokens for pills and Midjourney flag
  const tokens = raw
    .split(/[,;]+/)
    .map((t) => t.replace(/^(?:no|without|avoid|exclude)\s+/i, "").trim())
    .filter((t) => t.length > 0 && t.length < 40);

  // De-duplicate
  const uniqueTokens = Array.from(new Set(tokens.map((t) => t.toLowerCase())));

  const exclusionPills = uniqueTokens.map((t) => {
    return "No " + t.charAt(0).toUpperCase() + t.slice(1);
  });

  const midjourneyNoSyntax = `--no ${uniqueTokens.join(", ")}`;

  return {
    rawNegativeText: raw,
    exclusionPills:
      exclusionPills.length > 0
        ? exclusionPills
        : ["No text", "No watermark", "No logo", "No distortion"],
    midjourneyNoSyntax,
  };
}
