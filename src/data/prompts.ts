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
  | "graphic-design";

export interface PromptItem {
  id: string;
  title: string;
  prompt: string;
  category: PromptCategory;
  model: AIModel;
  tags: string[];
  imageUrl: string;
  imageAlt: string;
  aspectRatio: "portrait" | "landscape" | "square";
  aspectRatioValue: string; // e.g. "4/5", "3/4", "16/9", "1/1"
  dominantColor: string; // for reserving space and smooth loading without layout shift
  sourceAttribution: {
    source: string;
    author: string;
    authorUrl: string;
    license: string;
  };
}

export const STARTER_PROMPTS: PromptItem[] = [
  {
    id: "prompt-1",
    title: "Cinematic 35mm Street Portrait in Tokyo Dusk",
    prompt:
      "A candid cinematic street portrait of a woman standing beneath neon signs on a rainy Tokyo avenue at twilight. Shot on 35mm film, Kodachrome color grading, gentle rain reflections on asphalt, shallow depth of field, f/1.4 aperture, subtle film grain, natural evening illumination, realistic skin textures, 8k resolution.",
    category: "photography",
    model: "Midjourney v6.1",
    tags: ["35mm", "street-photography", "neon", "tokyo", "cinematic", "kodachrome"],
    imageUrl:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Atmospheric street portrait lit by vivid evening city lights",
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#1a162b",
    sourceAttribution: {
      source: "Unsplash",
      author: "Alex Knight",
      authorUrl: "https://unsplash.com/@agk42",
      license: "Unsplash Free License",
    },
  },
  {
    id: "prompt-2",
    title: "Biophilic Sustainable Modern Villa with Hanging Gardens",
    prompt:
      "Modern minimalist architectural exterior of a sustainable concrete and timber residence nestled on a hillside. Cascading native flora, large floor-to-ceiling glass pavilions, warm interior ambient lights, peaceful reflection pool, overcast soft daylight, architectural photography, Hasselblad H6D-100c, tilt-shift lens.",
    category: "architecture",
    model: "FLUX.1 [dev]",
    tags: ["architecture", "sustainable", "minimalism", "biophilic", "tilt-shift"],
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Contemporary luxury architecture integrated seamlessly with lush greenery",
    aspectRatio: "landscape",
    aspectRatioValue: "4/3",
    dominantColor: "#2c3327",
    sourceAttribution: {
      source: "Unsplash",
      author: "R Architecture",
      authorUrl: "https://unsplash.com/@rarchitecture_melbourne",
      license: "Unsplash Free License",
    },
  },
  {
    id: "prompt-3",
    title: "Celestial Cyberpunk Nomad Character Design",
    prompt:
      "Stylized character design illustration of a celestial desert nomad wearing high-tech scavenger armor crafted from weathered ceramics and copper alloy. Flowing linen hooded cloak, glowing holographic visor, intricate mechanical gauntlet, dramatic sunset rim lighting, concept art trending on ArtStation, Octane render.",
    category: "character-design",
    model: "Midjourney v6.1",
    tags: ["character-design", "concept-art", "cyberpunk", "sci-fi", "holographic"],
    imageUrl:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Futuristic warrior concept portrait with dramatic lighting",
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#24181f",
    sourceAttribution: {
      source: "Unsplash",
      author: "Avel Chuklanov",
      authorUrl: "https://unsplash.com/@chuklanov",
      license: "Unsplash Free License",
    },
  },
  {
    id: "prompt-4",
    title: "Mystic Pine Forest in Volumetric Morning Fog",
    prompt:
      "Aerial low-angle landscape of ancient evergreen pine trees emerging through thick morning mist in the Pacific Northwest mountains. God rays piercing damp atmosphere, deep emerald and charcoal tones, damp mossy boulders, crisp cool autumn breeze feeling, National Geographic photography style, high dynamic range.",
    category: "nature",
    model: "Stable Diffusion XL",
    tags: ["nature", "landscape", "fog", "pine-trees", "volumetric-light", "mountains"],
    imageUrl:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Lush misty pine forest under diffused morning sunlight",
    aspectRatio: "landscape",
    aspectRatioValue: "16/10",
    dominantColor: "#1b2923",
    sourceAttribution: {
      source: "Unsplash",
      author: "Sebastian Unrau",
      authorUrl: "https://unsplash.com/@sebastian_unrau",
      license: "Unsplash Free License",
    },
  },
  {
    id: "prompt-5",
    title: "Minimalist Isometric Workspace 3D Glassmorphism Render",
    prompt:
      "A clean isometric 3D render of a futuristic creative desk workspace. Translucent frosted glass desk, miniature potted bonsai, holographic mechanical keyboard, ceramic espresso mug, soft pastel studio gradient backdrop, clay material and octane shaders, soft ambient occlusion, sleek modern aesthetic.",
    category: "graphic-design",
    model: "DALL-E 3",
    tags: ["isometric", "3d-render", "glassmorphism", "octane", "workspace", "minimalist"],
    imageUrl:
      "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Minimalist workspace setup with clean aesthetics and warm lighting",
    aspectRatio: "landscape",
    aspectRatioValue: "4/3",
    dominantColor: "#2a2829",
    sourceAttribution: {
      source: "Unsplash",
      author: "Howard Bouchevereau",
      authorUrl: "https://unsplash.com/@howardbouchevereau",
      license: "Unsplash Free License",
    },
  },
  {
    id: "prompt-6",
    title: "Surreal Floating Botanical Island Concept Art",
    prompt:
      "Digital matte painting of a gravity-defying floating island with ancient weeping willow trees, crystal waterfalls spilling into ethereal clouds below. Bioluminescent butterflies, soft golden sunset horizon, whimsical fantasy environment, Moebius and Studio Ghibli inspired color palette, painterly brushwork.",
    category: "digital-art",
    model: "Midjourney v6.1",
    tags: ["fantasy", "concept-art", "floating-island", "matte-painting", "ghibli"],
    imageUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Whimsical fantasy landscape with ethereal light and dramatic clouds",
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#201826",
    sourceAttribution: {
      source: "Unsplash",
      author: "Kalen Emsley",
      authorUrl: "https://unsplash.com/@kalenemsley",
      license: "Unsplash Free License",
    },
  },
  {
    id: "prompt-7",
    title: "High-Fashion Haute Couture Studio Portrait with Prismatic Light",
    prompt:
      "Editorial studio fashion photography of a model wearing an avant-garde sculptural garment made of reflective pleated organza. Creative prism glass lens refraction, vibrant magenta and amber rainbow highlights across the cheekbones, sharp contrast, Leica SL2, 90mm f/2 Summicron lens, Vogue cover aesthetic.",
    category: "photography",
    model: "FLUX.1 [dev]",
    tags: ["fashion", "editorial", "studio", "prismatic", "leica", "avant-garde"],
    imageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
    imageAlt: "High-contrast editorial portrait with elegant artistic lighting",
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#312028",
    sourceAttribution: {
      source: "Unsplash",
      author: "Aiony Haust",
      authorUrl: "https://unsplash.com/@aiony",
      license: "Unsplash Free License",
    },
  },
  {
    id: "prompt-8",
    title: "Brutalist Concrete Museum Atrium with Dramatic Skylight",
    prompt:
      "Monolithic brutalist museum interior featuring curved raw board-formed concrete walls, massive geometric spiral staircase, and an oculus skylight casting a sharp diagonal beam of sun across polished terrazzo flooring. Quiet contemplative atmosphere, architectural minimalism, black and white tone, high dynamic range.",
    category: "architecture",
    model: "Stable Diffusion XL",
    tags: ["brutalism", "concrete", "interior", "oculus", "architecture", "monochrome"],
    imageUrl:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Dramatic architectural interior with concrete textures and strong geometric shadows",
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#222222",
    sourceAttribution: {
      source: "Unsplash",
      author: "Danist Soh",
      authorUrl: "https://unsplash.com/@danistsoh",
      license: "Unsplash Free License",
    },
  },
  {
    id: "prompt-9",
    title: "Cybernetic Android Pilot with Luminescent Optic Sensors",
    prompt:
      "Intricate portrait of an android mecha pilot. Translucent matte porcelain synthetic skull with visible fiber-optic conduits beneath, calm human-like expressions, luminescent cyan ocular rings, titanium neck servos, depth of field, Ray-traced cinematic lighting, Unreal Engine 5 render, character concept.",
    category: "character-design",
    model: "Midjourney v6.1",
    tags: ["android", "mecha", "cybernetics", "unreal-engine", "sci-fi", "futurism"],
    imageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Sleek cybernetic character portrait with luminous futuristic accents",
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#172336",
    sourceAttribution: {
      source: "Unsplash",
      author: "Milad Fakurian",
      authorUrl: "https://unsplash.com/@fakurian",
      license: "Unsplash Free License",
    },
  },
  {
    id: "prompt-10",
    title: "Sun-Drenched Nordic Fjord with Mirror Water Reflections",
    prompt:
      "Panoramic vista of a dramatic Norwegian fjord during golden hour. Steep granite cliffs draped in light snow, glassy still emerald water reflecting the crimson sky, small red wooden rorbu cabin on the shoreline, crisp arctic atmosphere, Sony A7R V with 24-70mm GM lens, pristine clarity.",
    category: "nature",
    model: "FLUX.1 [dev]",
    tags: ["norway", "fjord", "reflections", "golden-hour", "landscape", "arctic"],
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Serene natural shoreline with calm water reflecting radiant skies",
    aspectRatio: "landscape",
    aspectRatioValue: "16/9",
    dominantColor: "#1d2938",
    sourceAttribution: {
      source: "Unsplash",
      author: "Sean Oulashin",
      authorUrl: "https://unsplash.com/@oulashin",
      license: "Unsplash Free License",
    },
  },
  {
    id: "prompt-11",
    title: "Abstract Kinetic Liquid Chrome Typography Poster",
    prompt:
      "Modern graphic design poster featuring molten liquid chrome 3D abstract letterforms melting over a textured off-white background. Iridescent mercury reflections, Swiss typographic layout with tight modern sans-serif subtitles, museum exhibition print, cinema 4D and Redshift render.",
    category: "graphic-design",
    model: "DALL-E 3",
    tags: ["graphic-design", "typography", "liquid-chrome", "poster", "swiss-style", "iridescent"],
    imageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Bold modern liquid metallic typography composition",
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#1d1f24",
    sourceAttribution: {
      source: "Unsplash",
      author: "Milad Fakurian",
      authorUrl: "https://unsplash.com/@fakurian",
      license: "Unsplash Free License",
    },
  },
  {
    id: "prompt-12",
    title: "Subterranean Crystal Cavern with Bioluminescent River",
    prompt:
      "Deep underground cavern glowing with colossal amethyst and fluorite crystal clusters. An electric turquoise subterranean river flowing smoothly through ancient stalagmites, glowing spore particles floating in the humid air, wide-angle cinematic shot, high fantasy matte painting, masterwork.",
    category: "digital-art",
    model: "ChatGPT-4o",
    tags: ["crystals", "cavern", "bioluminescence", "fantasy", "digital-art", "subterranean"],
    imageUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Ethereal luminous cave glowing with rich mineral crystal formations",
    aspectRatio: "portrait",
    aspectRatioValue: "3/4",
    dominantColor: "#1d142d",
    sourceAttribution: {
      source: "Unsplash",
      author: "Kalen Emsley",
      authorUrl: "https://unsplash.com/@kalenemsley",
      license: "Unsplash Free License",
    },
  },
];
