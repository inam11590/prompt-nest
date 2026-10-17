# PromptNest Missing-Asset Manifest: Personal Transformations & Midjourney Collection

**Audit Status**: Revised Step 10 Implementation  
**Pending Transformation Assets**: 50 Personal Photo Transformations (Staged as Drafts in Database)  
**Pending Creative Showcase Assets**: 25 Midjourney Creative Showcase Posts (Staged as Drafts in Database)  
**Live Published Assets**: 39 Posts (25 Unsplash Photographs + 14 Curated Starter Prompts)  
**Total Catalog Portfolio**: 114 Posts  

---

## 1. Provenance & Authorization Policy

In strict adherence to PromptNest's sourcing and intellectual property integrity standards:
1. **Owner-Confirmed Provenance**: The repository owner has confirmed that the target visual style examples originate from Midjourney. We record this strictly as `owner-confirmed` provenance without asserting independent external verification or assuming arbitrary public Midjourney gallery images are licensed for reuse.
2. **Zero Unauthorized Scraping**: We do not bulk-scrape Midjourney web galleries, community feeds, or competitor platforms.
3. **Zero Fabricated Generation Claims**: We never claim images were generated on our platform or via active pipelines when no such workflow was executed.
4. **Zero Phantom / Mock URLs**: We do not inject non-existent image URLs or broken external image links.
5. **Full Draft Staging**: All 50 personal transformation concepts have complete, production-grade text prompts for both Mode A ("Use my photo") and Mode B ("Match this example"), full photographic specs, metadata, and are securely staged in PostgreSQL as drafts with `asset_status = 'DRAFT_PENDING_ASSET'` and `published = false`.
6. **Integrity of Live Catalog**: All 39 existing published posts remain published, operational, and accessible.

---

## 2. Staged Personal Photo Transformation Inventory (50 Items)

The 50 personal-photo transformation concepts are divided evenly across 5 distinct categories (10 concepts each). Every concept provides complete specifications for generating matching style artwork in Midjourney.

### Category 1: Cricket & Sports Portraits (10 Concepts)

| Key | Slug | Title | Aspect Ratio | Target Dimensions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `transform-sports-01` | `t20-night-match-power-hitter-pull-shot` | T20 Night Match Power Hitter Pull Shot | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-sports-02` | `red-ball-test-match-fast-bowler-stride` | Red-Ball Test Match Fast Bowler Delivery Stride | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-sports-03` | `wicketkeeper-stumping-in-rain-atmosphere` | Wicketkeeper Stumping in Rain Atmosphere | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-sports-04` | `indoor-net-practice-training-session` | Indoor Net Practice Batting Drill | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-sports-05` | `urban-street-tape-ball-cricket-hero` | Urban Street Tape-Ball Cricket Hero | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-sports-06` | `dressing-room-match-winner-captain` | Dressing Room Match Winner Captain | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-sports-07` | `classic-pavilion-veranda-batsman-portrait` | Classic Pavilion Veranda Batsman Portrait | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-sports-08` | `boundary-dive-fielding-specialist` | Airborne Boundary Dive Fielding Specialist | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-sports-09` | `express-pacer-wicket-celebration-roar` | Express Pacer Wicket Celebration Roar | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-sports-10` | `championship-trophy-stadium-tunnel` | Championship Trophy in Stadium Tunnel | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |

### Category 2: Cinematic Studio Portraits (10 Concepts)

| Key | Slug | Title | Aspect Ratio | Target Dimensions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `transform-cinematic-01` | `neo-noir-venetian-blind-shadow-portrait` | Neo-Noir Venetian Blind Shadow Portrait | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-cinematic-02` | `cyberpunk-neon-rain-trench-coat-headshot` | Cyberpunk Neon Rain Cinematic Headshot | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-cinematic-03` | `1970s-warm-kodachrome-analog-studio` | 1970s Warm Kodachrome Analog Studio | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-cinematic-04` | `rembrandt-key-light-velvet-elegance` | Rembrandt Key-Light Velvet Elegance | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-cinematic-05` | `minimalist-high-key-monochromatic-studio` | Minimalist High-Key Monochromatic Studio | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-cinematic-06` | `moody-prism-flare-cinematic-portrait` | Moody Glass Prism Flare Cinematic Portrait | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-cinematic-07` | `golden-amber-tungsten-hollywood-classic` | Golden Amber Tungsten Hollywood Classic | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-cinematic-08` | `dual-tone-sculpted-profile-studio` | Dual-Tone Sculpted Profile Studio | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-cinematic-09` | `atmospheric-smoke-backlight-silhouette` | Atmospheric Smoke & Backlight Silhouette | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-cinematic-10` | `vintage-polaroid-flash-aesthetic` | Vintage Direct-Flash Polaroid Aesthetic | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |

### Category 3: Professional Editorial Portraits (10 Concepts)

| Key | Slug | Title | Aspect Ratio | Target Dimensions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `transform-editorial-01` | `forbes-executive-tech-founder-office` | Forbes-Style Executive Tech Founder | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-editorial-02` | `modern-architectural-digest-designer` | Architectural Digest Interior Designer | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-editorial-03` | `fine-art-ceramicist-sunlit-loft` | Fine Art Ceramicist in Sunlit Loft | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-editorial-04` | `high-fashion-editorial-monolith-coat` | High-Fashion Editorial Monolith Coat | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-editorial-05` | `creative-agency-director-headshot` | Creative Agency Director Headshot | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-editorial-06` | `artisan-horologist-watchmaker-workbench` | Master Horologist at Watchmaker Workbench | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-editorial-07` | `culinary-master-chef-stainless-kitchen` | Michelin-Star Master Chef in Kitchen | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-editorial-08` | `classical-concert-musician-with-cello` | Classical Concert Cellist on Stage | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-editorial-09` | `environmental-scientist-field-cabin` | Field Biologist & Environmental Scientist | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-editorial-10` | `botanical-landscape-architect-greenhouse` | Botanical Landscape Architect in Conservatory | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |

### Category 4: Streetwear & Fashion Portraits (10 Concepts)

| Key | Slug | Title | Aspect Ratio | Target Dimensions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `transform-streetwear-01` | `shibuya-crosswalk-cyber-streetwear` | Shibuya Crosswalk Cyber-Streetwear | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-streetwear-02` | `scandinavian-minimalist-wool-coat-fog` | Scandinavian Minimalist Wool Coat in Fog | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-streetwear-03` | `90s-vintage-oversized-leather-jacket` | 90s Vintage Oversized Leather Jacket | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-streetwear-04` | `avant-garde-draped-silk-organza-gown` | Avant-Garde Draped Silk & Organza Gown | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-streetwear-05` | `high-tech-waterproof-gore-tex-explorer` | High-Tech GORE-TEX Urban Explorer | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-streetwear-06` | `pastel-color-blocked-retro-tracksuit` | Pastel Color-Blocked Retro Tracksuit | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-streetwear-07` | `desert-nomadic-silk-layers-storm` | Desert Nomadic Silk Layers in Sandstorm | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-streetwear-08` | `industrial-warehouse-raw-selvedge-denim` | Industrial Warehouse Raw Selvedge Denim | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-streetwear-09` | `metallic-chrome-liquid-puffer-couture` | Metallic Liquid Chrome Puffer Couture | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-streetwear-10` | `bohemian-velvet-trench-paris-cafe` | Bohemian Velvet Trench at Parisian Terrace | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |

### Category 5: Outdoor & Travel Portraits (10 Concepts)

| Key | Slug | Title | Aspect Ratio | Target Dimensions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `transform-travel-01` | `icelandic-volcanic-black-sand-beach` | Icelandic Black Sand Beach Solitude | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-travel-02` | `sahara-desert-dune-sunset-trekker` | Sahara Desert Sunset Caravan Trekker | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-travel-03` | `swiss-alpine-glacier-summit-climber` | Swiss Alpine Glacier Summit Climber | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-travel-04` | `kyoto-bamboo-forest-misty-morning` | Kyoto Arashiyama Bamboo Grove Wanderer | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-travel-05` | `amalfi-cliffside-mediterranean-stroll` | Amalfi Coastline Mediterranean Stroll | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-travel-06` | `scottish-highlands-heather-moor-rain` | Scottish Highlands Glen in Soft Rain | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-travel-07` | `patagonia-turquoise-glacial-lake-trek` | Patagonia Torres del Paine Glacial Trek | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-travel-08` | `moroccan-riad-tile-courtyard-sunlight` | Moroccan Riad Mosaic Courtyard | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-travel-09` | `northern-lights-aurora-borealis-camp` | Northern Lights Arctic Aurora Camp | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `transform-travel-10` | `california-redwood-cathedral-forest-walk` | California Coastal Redwood Forest Walk | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |

---

## 3. Previously Staged Midjourney Creative Showcase (25 Items)

| Key | Slug | Category | Title | Aspect Ratio | Target Dimensions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `mj-portrait-01` | `ethereal-cybernetic-humanoid-porcelain-portrait` | Portraits | Ethereal Cybernetic Humanoid Porcelain Portrait | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-portrait-02` | `renaissance-chiaroscuro-astronomer-portrait` | Portraits | Renaissance Chiaroscuro Astronomer Portrait | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-portrait-03` | `bioluminescent-deep-sea-diver-portrait` | Portraits | Bioluminescent Deep-Sea Diver Portrait | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-portrait-04` | `solarpunk-botanist-greenhouse-portrait` | Portraits | Solarpunk Botanist Greenhouse Portrait | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-portrait-05` | `monochrome-film-noir-detective-portrait` | Portraits | Monochrome Film Noir Detective Portrait | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-nature-01` | `bioluminescent-crystal-canyon-chasm` | Nature & Landscapes | Bioluminescent Crystal Canyon Chasm | 3/2 | 900x600 | DRAFT_PENDING_ASSET |
| `mj-nature-02` | `floating-islands-aurora-borealis-fjord` | Nature & Landscapes | Floating Islands Aurora Borealis Fjord | 3/2 | 900x600 | DRAFT_PENDING_ASSET |
| `mj-nature-03` | `giant-ancient-baobab-sunset-savannah` | Nature & Landscapes | Giant Ancient Baobab Sunset Savannah | 3/2 | 900x600 | DRAFT_PENDING_ASSET |
| `mj-nature-04` | `volcanic-black-sand-icelandic-waterfall` | Nature & Landscapes | Volcanic Black Sand Icelandic Waterfall | 3/2 | 900x600 | DRAFT_PENDING_ASSET |
| `mj-nature-05` | `serene-japanese-zen-bamboo-grove-rain` | Nature & Landscapes | Serene Japanese Zen Bamboo Grove in Rain | 3/2 | 900x600 | DRAFT_PENDING_ASSET |
| `mj-arch-01` | `organic-zaha-inspired-futuristic-desert-museum` | Architecture & Interiors | Organic Futuristic Desert Museum | 3/2 | 900x600 | DRAFT_PENDING_ASSET |
| `mj-arch-02` | `cyberpunk-tokyo-high-density-megastructure` | Architecture & Interiors | Cyberpunk High-Density Megastructure | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-arch-03` | `biophilic-hanging-gardens-treehouse-atrium` | Architecture & Interiors | Biophilic Hanging Gardens Treehouse Atrium | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-arch-04` | `neo-gothic-cyber-cathedral-interior` | Architecture & Interiors | Neo-Gothic Cyber Cathedral Interior | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-arch-05` | `subterranean-lunar-habitat-observatory` | Architecture & Interiors | Subterranean Lunar Habitat Observatory | 3/2 | 900x600 | DRAFT_PENDING_ASSET |
| `mj-food-01` | `cosmic-galactic-swirl-mirror-glaze-cake` | Food & Product | Cosmic Galactic Swirl Mirror Glaze Cake | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-food-02` | `futuristic-holographic-sneaker-product-render` | Food & Product | Futuristic Holographic Sneaker Product Render | 3/2 | 900x600 | DRAFT_PENDING_ASSET |
| `mj-food-03` | `ancient-alchemical-elixir-potion-vial` | Food & Product | Ancient Alchemical Elixir Potion Vial | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-food-04` | `zero-gravity-exploding-citrus-cocktail` | Food & Product | Zero-Gravity Exploding Citrus Cocktail | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-food-05` | `precision-mechanical-tourbillon-wrist-watch` | Food & Product | Precision Mechanical Tourbillon Wristwatch | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-fashion-01` | `cyber-couture-chromatic-liquid-mercury-dress` | Fashion & Cinematic | Cyber Couture Chromatic Liquid Mercury Gown | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-fashion-02` | `dune-desert-nomad-silk-couture-storm` | Fashion & Cinematic | Dune Desert Silk Couture in Sandstorm | 3/2 | 900x600 | DRAFT_PENDING_ASSET |
| `mj-fashion-03` | `blade-runner-neon-rain-trench-coat-cinematic` | Fashion & Cinematic | Blade Runner Neon Rain Trench Coat | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-fashion-04` | `victorian-steampunk-airship-captain-gown` | Fashion & Cinematic | Victorian Steampunk Airship Captain Gown | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |
| `mj-fashion-05` | `surrealist-cloud-couture-ethereal-ballerina` | Fashion & Cinematic | Surrealist Cloud Couture Ethereal Ballerina | 3/4 | 900x1200 | DRAFT_PENDING_ASSET |

---

## 4. Owner & Administrator Asset Provisioning Instructions

To transition any or all of the 50 personal transformation drafts into live published posts:

### Option A: Local Image Asset Placement & Promotion CLI
1. Generate the style reference image using Midjourney v6.1 with the detailed generation parameters provided in `src/data/personalTransformationPrompts.json`.
2. Save the image file locally in `public/images/midjourney/` named after the post's import key:
   ```bash
   public/images/midjourney/transform-sports-01.jpg
   public/images/midjourney/transform-sports-02.jpg
   # ... up to transform-outdoor-10.jpg
   ```
3. Promote the post to published status via the dedicated CLI:
   ```bash
   # Promote a single verified concept
   node scripts/import-personal-transformations.mjs --promote transform-sports-01
   ```
4. The CLI sets `status = 'published'`, `published = true`, and `asset_status = 'READY'`.

### Option B: Administrator Console Direct Upload
1. Log into PromptNest with an administrator account at `/admin`.
2. Locate the concept under `/admin/prompts` (filtered by drafts).
3. Click **Edit**, upload the high-resolution Midjourney asset through the Sharp-validated media pipeline (strips EXIF metadata, resizes to target aspect ratio, converts to modern WebP format).
4. Verify the dual prompt tabs and toggle status to **Published**.
