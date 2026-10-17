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
  | "cricket";

export interface PromptItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  prompt: string; // Mode A ("Use my photo")
  promptMatchExample?: string; // Mode B ("Match this example")
  styleInspiration?: string; // Style inspiration label
  isCricketIdentity?: boolean; // Flag for cricket identity-preserving prompt
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
  status?: "draft" | "published" | "archived"; // publication lifecycle state
  updatedAt?: string; // ISO 8601 timestamp for concurrency checks
  negativePrompt?: string; // Optional: only present when explicitly stored
  generationParameters?: Record<string, string | number>; // Optional generation params
  sourceAttribution: {
    source: string;
    author: string;
    authorUrl: string;
    license: string;
  };
  imageProvenance?: {
    source: string;
    license: string;
    generationMethod?: string;
    dimensions?: { width: number; height: number };
  };
  authorId?: string; // Optional creator user ID
  author?: {
    username: string;
    displayName: string | null;
    avatarUrl?: string | null;
  };
}

import { CRICKET_PROMPTS_DATASET } from "./cricketPrompts";

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
  },
];

export const STARTER_PROMPTS: PromptItem[] = [
  ...ORIGINAL_STARTER_PROMPTS,
  ...CRICKET_PROMPTS_DATASET,
];

export function getPromptBySlug(slug: string): PromptItem | undefined {
  return STARTER_PROMPTS.find((p) => p.slug === slug);
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
    .filter((p) => p.slug !== currentPrompt.slug)
    .map((candidate) => {
      let score = 0;

      // 1. Category match (highest priority signal)
      if (candidate.category === currentPrompt.category) {
        score += 10;
      }

      // 2. Shared tags match
      const currentTags = new Set(currentPrompt.tags.map((t) => t.toLowerCase()));
      const sharedTagsCount = candidate.tags.filter((t) =>
        currentTags.has(t.toLowerCase())
      ).length;
      score += sharedTagsCount * 3;

      // 3. Compatible AI model overlap
      const currentModels = new Set([
        currentPrompt.model,
        ...(currentPrompt.compatibleModels || []),
      ]);
      const candidateModels = [
        candidate.model,
        ...(candidate.compatibleModels || []),
      ];
      const modelOverlap = candidateModels.filter((m) => currentModels.has(m)).length;
      score += modelOverlap * 2;

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
