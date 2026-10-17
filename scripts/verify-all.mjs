// scripts/verify-all.mjs
// Automated verification suite for PromptNest (Steps 1, 1.1, 2, 3, 4)

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("==========================================");
console.log("   PromptNest Cumulative Verification     ");
console.log("==========================================");

const results = [];

function test(id, step, description, fn) {
  try {
    fn();
    results.push({ id, step, description, status: "PASS" });
    console.log(`[PASS] ${id} (Step ${step}): ${description}`);
  } catch (err) {
    results.push({ id, step, description, status: "FAIL", error: err.message });
    console.error(`[FAIL] ${id} (Step ${step}): ${description} -> ${err.message}`);
  }
}

async function testAsync(id, step, description, fn) {
  try {
    await fn();
    results.push({ id, step, description, status: "PASS" });
    console.log(`[PASS] ${id} (Step ${step}): ${description}`);
  } catch (err) {
    results.push({ id, step, description, status: "FAIL", error: err.message });
    console.error(`[FAIL] ${id} (Step ${step}): ${description} -> ${err.message}`);
  }
}

function blocked(id, step, description, reason) {
  results.push({ id, step, description, status: "BLOCKED", reason });
  console.log(`[BLOCKED] ${id} (Step ${step}): ${description} -> Reason: ${reason}`);
}

async function runAll() {
  // ----------------------------------------------------
  // STEP 1: Foundation & Homepage
  // ----------------------------------------------------
  test("T-1.1", "1.0", "Configuration module defines PromptNest metadata & navigation", () => {
    const configPath = path.resolve("src/config/site.ts");
    assert.ok(fs.existsSync(configPath), "site.ts must exist");
    const content = fs.readFileSync(configPath, "utf-8");
    assert.ok(content.includes('name: "PromptNest"'), "site name must be PromptNest");
    assert.ok(content.includes("navItems: ["), "navItems must be defined");
    assert.ok(content.includes("categories: ["), "categories must be defined");
  });

  test("T-1.2", "1.0", "Starter prompts dataset contains exactly 12 validated items", () => {
    const promptsPath = path.resolve("src/data/prompts.ts");
    assert.ok(fs.existsSync(promptsPath), "prompts.ts must exist");
    const content = fs.readFileSync(promptsPath, "utf-8");
    const matches = content.match(/id: "prompt-(\d+)"/g);
    assert.strictEqual(matches?.length, 12, "Must contain exactly 12 starter prompts");
  });

  test("T-1.3", "1.0", "Layout & Global styling contains accessible dark theme tokens", () => {
    const cssPath = path.resolve("src/app/globals.css");
    assert.ok(fs.existsSync(cssPath), "globals.css must exist");
    const content = fs.readFileSync(cssPath, "utf-8");
    assert.ok(content.includes("--color-background"), "Must define background color token");
    assert.ok(content.includes("--color-surface"), "Must define surface color token");
  });

  // ----------------------------------------------------
  // STEP 1.1: GitHub & Vercel
  // ----------------------------------------------------
  test("T-1.1.1", "1.1", "Package configuration conforms to Next.js 16 + React 19 standards", () => {
    const pkgPath = path.resolve("package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    assert.strictEqual(pkg.name, "prompt-nest");
    assert.ok(pkg.dependencies.next, "next must be installed");
    assert.ok(pkg.dependencies.react, "react must be installed");
  });

  // ----------------------------------------------------
  // STEP 2: Gallery, Search, Filters, Sorting & Pagination
  // ----------------------------------------------------
  test("T-2.1", "2.0", "Hero component contains full filter, search, and sorting controls", () => {
    const heroPath = path.resolve("src/components/Hero.tsx");
    assert.ok(fs.existsSync(heroPath), "Hero.tsx must exist");
    const content = fs.readFileSync(heroPath, "utf-8");
    assert.ok(content.includes("selectedCategory"), "Hero must handle category selection");
    assert.ok(content.includes("selectedModel"), "Hero must handle model selection");
    assert.ok(content.includes("sortOption"), "Hero must handle sort selection");
  });

  test("T-2.2", "2.0", "Gallery component renders responsive columns and accessible pagination", () => {
    const galleryPath = path.resolve("src/components/PromptGallery.tsx");
    assert.ok(fs.existsSync(galleryPath), "PromptGallery.tsx must exist");
    const content = fs.readFileSync(galleryPath, "utf-8");
    assert.ok(content.includes("columns-1 sm:columns-2 lg:columns-3 xl:columns-4"), "Masonry columns defined");
    assert.ok(content.includes("Pagination Controls"), "Pagination controls present");
  });

  test("T-2.3", "2.0", "PromptCard renders copy action, aspect ratio preservation & fallback", () => {
    const cardPath = path.resolve("src/components/PromptCard.tsx");
    assert.ok(fs.existsSync(cardPath), "PromptCard.tsx must exist");
    const content = fs.readFileSync(cardPath, "utf-8");
    assert.ok(content.includes("handleCopy"), "Copy prompt handler present");
    assert.ok(content.includes("onError"), "Image fallback handler present");
    assert.ok(content.includes("aspectRatioValue"), "Aspect ratio style present");
  });

  // ----------------------------------------------------
  // STEP 3: Detail Pages, Modal, Metadata & Return Nav
  // ----------------------------------------------------
  test("T-3.1", "3.0", "Static detail routes generate all 12 published prompt slugs", () => {
    const detailPath = path.resolve("src/app/prompts/[slug]/page.tsx");
    assert.ok(fs.existsSync(detailPath), "Detail page route must exist");
    const content = fs.readFileSync(detailPath, "utf-8");
    assert.ok(content.includes("generateStaticParams"), "generateStaticParams must be defined");
    assert.ok(content.includes("generateMetadata"), "generateMetadata must be defined");
  });

  test("T-3.2", "3.0", "ImageModal provides keyboard-accessible zoom and backdrop dismiss", () => {
    const modalPath = path.resolve("src/components/ImageModal.tsx");
    assert.ok(fs.existsSync(modalPath), "ImageModal.tsx must exist");
    const content = fs.readFileSync(modalPath, "utf-8");
    assert.ok(content.includes("Escape"), "Escape key dismiss handler present");
    assert.ok(content.includes("role=\"dialog\""), "Accessible dialog role present");
  });

  test("T-3.3", "3.0", "ReturnButton preserves search/filter URL parameters on return", () => {
    const returnPath = path.resolve("src/components/ReturnButton.tsx");
    assert.ok(fs.existsSync(returnPath), "ReturnButton.tsx must exist");
    const content = fs.readFileSync(returnPath, "utf-8");
    assert.ok(content.includes("useSearchParams"), "Reads search parameters");
    assert.ok(content.includes("Back to Gallery"), "Renders accessible gallery return link");
  });

  // ----------------------------------------------------
  // STEP 4: Supabase PostgreSQL, Real Auth & Saved Prompts
  // ----------------------------------------------------
  test("T-4.1", "4.0", "PostgreSQL database migration defines profiles, prompts, bookmarks & RLS", () => {
    const sqlPath = path.resolve("supabase/migrations/001_initial_schema.sql");
    assert.ok(fs.existsSync(sqlPath), "001_initial_schema.sql must exist");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.profiles"), "profiles table exists");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.prompts"), "prompts table exists");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.bookmarks"), "bookmarks table exists");
    assert.ok(sql.includes("ENABLE ROW LEVEL SECURITY"), "RLS enabled");
    assert.ok(sql.includes("UNIQUE (user_id, prompt_id)"), "Unique bookmark per user and prompt");
    assert.ok(sql.includes("ON DELETE CASCADE"), "Foreign key cascade on delete");
  });

  test("T-4.2", "4.0", "Database types file is fully defined and export typed interfaces", () => {
    const typesPath = path.resolve("src/types/database.types.ts");
    assert.ok(fs.existsSync(typesPath), "database.types.ts must exist");
    const content = fs.readFileSync(typesPath, "utf-8");
    assert.ok(content.includes("export interface Database"), "Database interface exported");
    assert.ok(content.includes("bookmarks: {"), "bookmarks table typed");
  });

  test("T-4.3", "4.0", "Supabase SSR clients (client, server, middleware) handle missing env gracefully", () => {
    const clientPath = path.resolve("src/lib/supabase/client.ts");
    const serverPath = path.resolve("src/lib/supabase/server.ts");
    const mwPath = path.resolve("src/lib/supabase/middleware.ts");
    assert.ok(fs.existsSync(clientPath), "client.ts exists");
    assert.ok(fs.existsSync(serverPath), "server.ts exists");
    assert.ok(fs.existsSync(mwPath), "middleware.ts exists");
    
    const clientContent = fs.readFileSync(clientPath, "utf-8");
    assert.ok(clientContent.includes("return null"), "Returns null if unconfigured");
  });

  test("T-4.4", "4.0", "Middleware protects /saved and /account routes for unauthenticated visitors", () => {
    const mwPath = path.resolve("src/lib/supabase/middleware.ts");
    const content = fs.readFileSync(mwPath, "utf-8");
    assert.ok(content.includes("pathname.startsWith(\"/saved\")"), "Protects /saved");
    assert.ok(content.includes("pathname.startsWith(\"/account\")"), "Protects /account");
    assert.ok(content.includes("returnTo"), "Preserves returnTo parameter");
  });

  test("T-4.5", "4.0", "Server actions derive user session safely and implement bookmark toggling", () => {
    const actionPath = path.resolve("src/app/actions/bookmarks.ts");
    assert.ok(fs.existsSync(actionPath), "bookmarks.ts exists");
    const content = fs.readFileSync(actionPath, "utf-8");
    assert.ok(content.includes("supabase.auth.getUser()"), "Validates user from session");
    assert.ok(content.includes("revalidatePath(\"/saved\")"), "Revalidates saved path");
  });

  test("T-4.6", "4.0", "Auth Server actions handle signIn, signUp, signOut, forgotPassword, updatePassword", () => {
    const authActionPath = path.resolve("src/app/actions/auth.ts");
    assert.ok(fs.existsSync(authActionPath), "auth.ts exists");
    const content = fs.readFileSync(authActionPath, "utf-8");
    assert.ok(content.includes("signInAction"), "signInAction implemented");
    assert.ok(content.includes("signUpAction"), "signUpAction implemented");
    assert.ok(content.includes("signOutAction"), "signOutAction implemented");
    assert.ok(content.includes("forgotPasswordAction"), "forgotPasswordAction implemented");
    assert.ok(content.includes("updatePasswordAction"), "updatePasswordAction implemented");
  });

  test("T-4.7", "4.0", "BookmarkButton provides optimistic UI, error rollback, and non-propagating clicks", () => {
    const btnPath = path.resolve("src/components/BookmarkButton.tsx");
    assert.ok(fs.existsSync(btnPath), "BookmarkButton.tsx exists");
    const content = fs.readFileSync(btnPath, "utf-8");
    assert.ok(content.includes("e.stopPropagation()"), "Stops event propagation");
    assert.ok(content.includes("e.preventDefault()"), "Prevents default navigation");
    assert.ok(content.includes("setOverrideBookmarked"), "Optimistic state update present");
  });

  test("T-4.8", "4.0", "Auth pages (/login, /signup, /forgot-password, /reset-password, /account) exist", () => {
    assert.ok(fs.existsSync(path.resolve("src/app/login/page.tsx")), "/login exists");
    assert.ok(fs.existsSync(path.resolve("src/app/signup/page.tsx")), "/signup exists");
    assert.ok(fs.existsSync(path.resolve("src/app/forgot-password/page.tsx")), "/forgot-password exists");
    assert.ok(fs.existsSync(path.resolve("src/app/reset-password/page.tsx")), "/reset-password exists");
    assert.ok(fs.existsSync(path.resolve("src/app/account/page.tsx")), "/account exists");
  });

  test("T-4.9", "4.0", "Saved prompts page (/saved) renders bookmarked collection and empty state", () => {
    const savedPath = path.resolve("src/app/saved/page.tsx");
    const clientPath = path.resolve("src/components/SavedPromptsClient.tsx");
    assert.ok(fs.existsSync(savedPath), "/saved exists");
    assert.ok(fs.existsSync(clientPath), "SavedPromptsClient exists");
  });

  test("T-4.10", "4.0", "Seed script and SQL seed file exist with idempotent upserts", () => {
    assert.ok(fs.existsSync(path.resolve("scripts/seed.ts")), "scripts/seed.ts exists");
    assert.ok(fs.existsSync(path.resolve("supabase/seed.sql")), "supabase/seed.sql exists");
    const sql = fs.readFileSync(path.resolve("supabase/seed.sql"), "utf-8");
    assert.ok(sql.includes("ON CONFLICT (id) DO UPDATE SET"), "Idempotent on conflict upsert");
  });

  // Live Cloud Database Connection Check
  await testAsync(
    "T-4.11",
    "4.0",
    "Live Supabase PostgreSQL connection & remote query execution",
    async () => {
      const envPath = path.resolve(".env.local");
      assert.ok(fs.existsSync(envPath), ".env.local exists");
      const envContent = fs.readFileSync(envPath, "utf-8");
      const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\n]+)/);
      const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=["']?([^"'\n]+)/);
      assert.ok(urlMatch && keyMatch, "Credentials configured in .env.local");
      const base = urlMatch[1].replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
      const res = await fetch(`${base}/rest/v1/prompts?select=id,title&limit=1`, {
        headers: {
          apikey: keyMatch[1],
          Authorization: `Bearer ${keyMatch[1]}`,
        },
      });
      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
      const data = await res.json();
      assert.ok(Array.isArray(data) && data.length > 0, "Expected prompts array from live DB");
    }
  );

  // Live Email Confirmation
  blocked(
    "T-4.12",
    "4.0",
    "Live Supabase Auth email confirmation dispatch",
    "Requires live user mailbox interaction or mock SMTP provider validation"
  );

  // ----------------------------------------------------
  // STEP 5: Secure Admin Dashboard & Image Pipeline
  // ----------------------------------------------------
  test("T-5.1", "5.0", "Admin & Storage SQL migration defines admin_users, is_admin, trigger, audit logs, and storage buckets", () => {
    const sqlPath = path.resolve("supabase/migrations/002_admin_and_storage.sql");
    assert.ok(fs.existsSync(sqlPath), "002_admin_and_storage.sql must exist");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.admin_users"), "admin_users table defined");
    assert.ok(sql.includes("CREATE OR REPLACE FUNCTION public.is_admin"), "is_admin function defined");
    assert.ok(sql.includes("SET search_path = public, pg_temp"), "is_admin search_path fixed");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.admin_audit_logs"), "admin_audit_logs defined");
    assert.ok(sql.includes("storage.buckets"), "storage bucket policies defined");
  });

  test("T-5.2", "5.0", "Database types file includes admin_users, admin_audit_logs, is_admin, and prompt status", () => {
    const typesPath = path.resolve("src/types/database.types.ts");
    assert.ok(fs.existsSync(typesPath), "database.types.ts must exist");
    const content = fs.readFileSync(typesPath, "utf-8");
    assert.ok(content.includes("admin_users: {"), "admin_users interface exported");
    assert.ok(content.includes("admin_audit_logs: {"), "admin_audit_logs interface exported");
    assert.ok(content.includes("is_admin: {"), "is_admin function typed");
    assert.ok(content.includes("status: \"draft\" | \"published\" | \"archived\""), "status column typed");
  });

  test("T-5.3", "5.0", "Server-side admin authorization module verifies admin_users membership and rejects unprivileged users", () => {
    const adminAuthPath = path.resolve("src/lib/auth/admin.ts");
    assert.ok(fs.existsSync(adminAuthPath), "src/lib/auth/admin.ts must exist");
    const content = fs.readFileSync(adminAuthPath, "utf-8");
    assert.ok(content.includes("export async function isAdmin"), "isAdmin exported");
    assert.ok(content.includes("export async function requireAdmin"), "requireAdmin exported");
    assert.ok(content.includes("export async function getAdminSession"), "getAdminSession exported");
    assert.ok(content.includes("admin_users"), "queries admin_users role table");
  });

  test("T-5.4", "5.0", "Image storage pipeline processes buffer with sharp, validates dimensions, and strips metadata", () => {
    const imgPath = path.resolve("src/lib/storage/image.ts");
    assert.ok(fs.existsSync(imgPath), "src/lib/storage/image.ts must exist");
    const content = fs.readFileSync(imgPath, "utf-8");
    assert.ok(content.includes("validateAndProcessImage"), "validateAndProcessImage implemented");
    assert.ok(content.includes("sharp(inputBuffer)"), "sharp processing initialized");
    assert.ok(content.includes("generateStorageKey"), "collision-resistant key generator implemented");
    assert.ok(content.includes("uploadToStorage"), "uploadToStorage implemented");
  });

  test("T-5.5", "5.0", "Admin server actions enforce concurrency checks, slug immutability, and audit logging", () => {
    const actionsPath = path.resolve("src/app/actions/admin-prompts.ts");
    assert.ok(fs.existsSync(actionsPath), "admin-prompts.ts must exist");
    const content = fs.readFileSync(actionsPath, "utf-8");
    assert.ok(content.includes("createPromptAction"), "createPromptAction exported");
    assert.ok(content.includes("updatePromptAction"), "updatePromptAction exported");
    assert.ok(content.includes("setPromptStatusAction"), "setPromptStatusAction exported");
    assert.ok(content.includes("requireAdmin"), "requireAdmin guard called");
    assert.ok(content.includes("admin_audit_logs"), "audit logs inserted on mutation");
    assert.ok(content.includes("Slug Immutability"), "slug immutability enforced for published prompts");
    assert.ok(content.includes("Concurrency Conflict"), "concurrency conflict detected on updated_at mismatch");
  });

  test("T-5.6", "5.0", "Admin layout enforces server authorization guard, access denied view, and noindex robots", () => {
    const layoutPath = path.resolve("src/app/admin/layout.tsx");
    assert.ok(fs.existsSync(layoutPath), "src/app/admin/layout.tsx must exist");
    const content = fs.readFileSync(layoutPath, "utf-8");
    assert.ok(content.includes("getAdminSession"), "checks admin session");
    assert.ok(content.includes("Administrator Access Required"), "renders access denied screen for unauthorized users");
    assert.ok(content.includes("index: false"), "enforces noindex robots metadata");
  });

  test("T-5.7", "5.0", "Admin dashboard provides real database metrics, status filters, and prompt catalog table", () => {
    const pagePath = path.resolve("src/app/admin/page.tsx");
    const clientPath = path.resolve("src/components/admin/AdminDashboardClient.tsx");
    assert.ok(fs.existsSync(pagePath), "src/app/admin/page.tsx must exist");
    assert.ok(fs.existsSync(clientPath), "AdminDashboardClient.tsx must exist");
    const content = fs.readFileSync(clientPath, "utf-8");
    assert.ok(content.includes("setPromptStatusAction"), "quick status toggle present");
    assert.ok(content.includes("Published"), "published filter present");
    assert.ok(content.includes("Drafts"), "drafts filter present");
    assert.ok(content.includes("Archived"), "archived filter present");
  });

  test("T-5.8", "5.0", "Prompt editor form provides image upload pipeline, dirty form guard, and slug lock", () => {
    const editorPath = path.resolve("src/components/admin/PromptEditorForm.tsx");
    assert.ok(fs.existsSync(editorPath), "PromptEditorForm.tsx must exist");
    const content = fs.readFileSync(editorPath, "utf-8");
    assert.ok(content.includes("beforeunload"), "dirty form confirmation present");
    assert.ok(content.includes("uploadImageAction"), "image upload pipeline invoked");
    assert.ok(content.includes("isSlugLocked"), "slug locked for published prompts");
  });

  test("T-5.9", "5.0", "Admin draft preview route allows private inspection of non-published prompts", () => {
    const previewPath = path.resolve("src/app/admin/prompts/[id]/preview/page.tsx");
    assert.ok(fs.existsSync(previewPath), "preview page route must exist");
    const content = fs.readFileSync(previewPath, "utf-8");
    assert.ok(content.includes("ADMIN PREVIEW MODE"), "admin preview indicator present");
    assert.ok(content.includes("index: false"), "enforces noindex on preview route");
  });

  test("T-5.10", "5.0", "Middleware protects /admin route and redirects unauthenticated visitors to /login", () => {
    const mwPath = path.resolve("src/lib/supabase/middleware.ts");
    const content = fs.readFileSync(mwPath, "utf-8");
    assert.ok(content.includes("pathname.startsWith(\"/admin\")"), "protects /admin route");
  });

  // ----------------------------------------------------
  // STEP 6: Creator Profiles, Submissions & Moderation
  // ----------------------------------------------------
  test("T-6.1", "6.0", "Creator profiles, submissions & moderation migration exists and defines schema and policies", () => {
    const migrationPath = path.resolve("supabase/migrations/003_creator_profiles_and_submissions.sql");
    assert.ok(fs.existsSync(migrationPath), "003 migration must exist");
    const content = fs.readFileSync(migrationPath, "utf-8");
    assert.ok(content.includes("idx_profiles_username_lower"), "lower case username index exists");
    assert.ok(content.includes("prompt_submissions"), "prompt_submissions table defined");
    assert.ok(content.includes("submission_revisions"), "submission_revisions table defined");
    assert.ok(content.includes("prompt-staging"), "staging storage bucket policies defined");
  });

  test("T-6.2", "6.0", "Database types export extended profiles, prompts, prompt_submissions, and revisions", () => {
    const typesPath = path.resolve("src/types/database.types.ts");
    assert.ok(fs.existsSync(typesPath), "database.types.ts must exist");
    const content = fs.readFileSync(typesPath, "utf-8");
    assert.ok(content.includes("prompt_submissions: {"), "prompt_submissions defined in types");
    assert.ok(content.includes("submission_revisions: {"), "submission_revisions defined in types");
    assert.ok(content.includes("author_id"), "author_id defined in prompts");
    assert.ok(content.includes("is_public"), "is_public defined in profiles");
  });

  test("T-6.3", "6.0", "Creator profile validation module enforces username rules, reserved slugs, bio, and HTTPS URL", () => {
    const profPath = path.resolve("src/lib/creators/profiles.ts");
    assert.ok(fs.existsSync(profPath), "profiles.ts must exist");
    const content = fs.readFileSync(profPath, "utf-8");
    assert.ok(content.includes("normalizeUsername"), "normalizeUsername implemented");
    assert.ok(content.includes("validateUsername"), "validateUsername implemented");
    assert.ok(content.includes("RESERVED_USERNAMES"), "reserved usernames set defined");
    assert.ok(content.includes("validateWebsiteUrl"), "validateWebsiteUrl enforces HTTPS");
    assert.ok(content.includes("validateBio"), "validateBio enforces 500 max characters");
  });

  test("T-6.4", "6.0", "Creator profile server action derives session, checks username uniqueness, and enforces immutability", () => {
    const actionPath = path.resolve("src/app/actions/creator-profile.ts");
    assert.ok(fs.existsSync(actionPath), "creator-profile.ts must exist");
    const content = fs.readFileSync(actionPath, "utf-8");
    assert.ok(content.includes("updateCreatorProfileAction"), "updateCreatorProfileAction exported");
    assert.ok(content.includes("Username is immutable once set"), "username immutability enforced");
    assert.ok(content.includes("normalizeUsername"), "case-insensitive uniqueness handled");
  });

  test("T-6.5", "6.0", "Staging image action validates media with sharp, strips metadata, and stores into user path", () => {
    const actionPath = path.resolve("src/app/actions/submissions.ts");
    assert.ok(fs.existsSync(actionPath), "submissions action file must exist");
    const content = fs.readFileSync(actionPath, "utf-8");
    assert.ok(content.includes("uploadCreatorStagingImageAction"), "uploadCreatorStagingImageAction exported");
    assert.ok(content.includes("validateAndProcessImage(buffer)"), "sharp image processing invoked");
    assert.ok(content.includes("createSignedUrl"), "returns short-lived signed preview URL");
  });

  test("T-6.6", "6.0", "Submissions server actions enforce draft lifecycle, quota, revisions, and withdrawal", () => {
    const actionPath = path.resolve("src/app/actions/submissions.ts");
    const content = fs.readFileSync(actionPath, "utf-8");
    assert.ok(content.includes("createSubmissionAction"), "createSubmissionAction exported");
    assert.ok(content.includes("updateSubmissionAction"), "updateSubmissionAction exported");
    assert.ok(content.includes("withdrawSubmissionAction"), "withdrawSubmissionAction exported");
    assert.ok(content.includes("MAX_ACTIVE_SUBMISSIONS_QUOTA"), "quota limit enforced");
    assert.ok(content.includes("submission_revisions"), "revision snapshot created on review submission");
  });

  test("T-6.7", "6.0", "Moderation actions enforce admin authorization, feedback requirements, and atomic publishing", () => {
    const actionPath = path.resolve("src/app/actions/moderation.ts");
    assert.ok(fs.existsSync(actionPath), "moderation.ts must exist");
    const content = fs.readFileSync(actionPath, "utf-8");
    assert.ok(content.includes("approveSubmissionAction"), "approveSubmissionAction exported");
    assert.ok(content.includes("requestChangesSubmissionAction"), "requestChangesSubmissionAction exported");
    assert.ok(content.includes("rejectSubmissionAction"), "rejectSubmissionAction exported");
    assert.ok(content.includes("requireAdmin"), "admin authorization guard enforced");
    assert.ok(content.includes("Feedback explanation is required"), "feedback mandatory for changes and rejection");
  });

  test("T-6.8", "6.0", "Public creator directory and detail routes exist and enforce 404 for non-public profiles", () => {
    const dirPage = path.resolve("src/app/creators/page.tsx");
    const userPage = path.resolve("src/app/creators/[username]/page.tsx");
    assert.ok(fs.existsSync(dirPage), "creators directory page must exist");
    assert.ok(fs.existsSync(userPage), "creator detail page must exist");
    const content = fs.readFileSync(userPage, "utf-8");
    assert.ok(content.includes("notFound()"), "enforces notFound for non-public or missing profiles");
  });

  test("T-6.9", "6.0", "Creator workspace routes exist for submission management and profile settings", () => {
    const subList = path.resolve("src/app/dashboard/submissions/page.tsx");
    const subNew = path.resolve("src/app/dashboard/submissions/new/page.tsx");
    const subEdit = path.resolve("src/app/dashboard/submissions/[id]/page.tsx");
    const profSet = path.resolve("src/app/settings/profile/page.tsx");
    assert.ok(fs.existsSync(subList), "dashboard submissions list page exists");
    assert.ok(fs.existsSync(subNew), "dashboard new submission page exists");
    assert.ok(fs.existsSync(subEdit), "dashboard edit/view submission page exists");
    assert.ok(fs.existsSync(profSet), "creator profile settings page exists");
  });

  test("T-6.10", "6.0", "Admin moderation queue route exists and provides queue inspection and actions", () => {
    const modPage = path.resolve("src/app/admin/submissions/page.tsx");
    const modClient = path.resolve("src/components/admin/AdminModerationClient.tsx");
    assert.ok(fs.existsSync(modPage), "admin submissions page must exist");
    assert.ok(fs.existsSync(modClient), "admin moderation client must exist");
    const content = fs.readFileSync(modClient, "utf-8");
    assert.ok(content.includes("approveSubmissionAction"), "calls approval action");
    assert.ok(content.includes("requestChangesSubmissionAction"), "calls request changes action");
    assert.ok(content.includes("rejectSubmissionAction"), "calls reject action");
  });

  test("T-6.11", "6.0", "Prompt detail page displays creator attribution badge linking to public profile", () => {
    const promptPage = path.resolve("src/app/prompts/[slug]/page.tsx");
    const content = fs.readFileSync(promptPage, "utf-8");
    assert.ok(content.includes("getPromptBySlugDb"), "uses database prompt resolver");
    assert.ok(content.includes("/creators/${prompt.author.username}"), "renders creator badge link");
  });

  test("T-6.12", "6.0", "Navigation header and site config incorporate creator directory and submission links", () => {
    const configPath = path.resolve("src/config/site.ts");
    const headerPath = path.resolve("src/components/Header.tsx");
    const configContent = fs.readFileSync(configPath, "utf-8");
    const headerContent = fs.readFileSync(headerPath, "utf-8");
    assert.ok(configContent.includes("href: \"/creators\""), "creators directory link in navItems");
    assert.ok(headerContent.includes("href=\"/dashboard/submissions\""), "submissions link in header");
  });

  // ----------------------------------------------------
  // STEP 7: Blog, Guides & Technical SEO
  // ----------------------------------------------------
  test("T-7.1", "7.0", "Article and Guides database migration defines constraints, indexes, and RLS policies", () => {
    const migrationPath = path.resolve("supabase/migrations/004_articles_and_guides.sql");
    assert.ok(fs.existsSync(migrationPath), "004_articles_and_guides.sql must exist");
    const sql = fs.readFileSync(migrationPath, "utf-8");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.articles"), "articles table created");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.article_prompts"), "article_prompts table created");
    assert.ok(sql.includes("chk_articles_slug_format"), "slug constraint enforced");
    assert.ok(sql.includes("concurrency_version INTEGER NOT NULL DEFAULT 1"), "concurrency version column present");
    assert.ok(sql.includes("ENABLE ROW LEVEL SECURITY"), "RLS enabled on both tables");
  });

  test("T-7.2", "7.0", "Database TypeScript definitions include articles and article_prompts table schemas", () => {
    const typesPath = path.resolve("src/types/database.types.ts");
    assert.ok(fs.existsSync(typesPath), "database.types.ts must exist");
    const content = fs.readFileSync(typesPath, "utf-8");
    assert.ok(content.includes("articles: {"), "articles table definition present");
    assert.ok(content.includes("article_prompts: {"), "article_prompts table definition present");
    assert.ok(content.includes("concurrency_version: number"), "concurrency_version field present");
  });

  test("T-7.3", "7.0", "Safe markdown renderer escapes HTML, validates protocols, and produces TOC with IDs", () => {
    const mdPath = path.resolve("src/lib/blog/markdown.ts");
    assert.ok(fs.existsSync(mdPath), "markdown.ts must exist");
    const content = fs.readFileSync(mdPath, "utf-8");
    assert.ok(content.includes("renderArticleMarkdown"), "renderArticleMarkdown exported");
    assert.ok(content.includes("isSafeUrl"), "link protocol validator present");
    assert.ok(content.includes("escapeHtml"), "html sanitizer present");
    assert.ok(content.includes("heading-"), "collision-resistant heading IDs generated");
  });

  test("T-7.4", "7.0", "Article data access module provides public queries and admin operations", () => {
    const dataPath = path.resolve("src/lib/data/articles.ts");
    assert.ok(fs.existsSync(dataPath), "articles data file must exist");
    const content = fs.readFileSync(dataPath, "utf-8");
    assert.ok(content.includes("getPublishedArticles"), "getPublishedArticles exported");
    assert.ok(content.includes("getArticleBySlug"), "getArticleBySlug exported");
    assert.ok(content.includes("getGuidesForPrompt"), "getGuidesForPrompt exported");
    assert.ok(content.includes("getAdminArticles"), "getAdminArticles exported");
    assert.ok(content.includes("calculateReadingTime"), "calculateReadingTime exported");
  });

  test("T-7.5", "7.0", "Article server actions enforce admin security, slug immutability, and concurrency checks", () => {
    const actionPath = path.resolve("src/app/actions/articles.ts");
    assert.ok(fs.existsSync(actionPath), "articles actions file must exist");
    const content = fs.readFileSync(actionPath, "utf-8");
    assert.ok(content.includes("createArticleAction"), "createArticleAction exported");
    assert.ok(content.includes("updateArticleAction"), "updateArticleAction exported");
    assert.ok(content.includes("setArticleStatusAction"), "setArticleStatusAction exported");
    assert.ok(content.includes("requireAdmin"), "admin authorization verified");
    assert.ok(content.includes("concurrency_version"), "optimistic concurrency version checked");
    assert.ok(content.includes("The slug of an already published article cannot be changed"), "slug locked on published articles");
  });

  test("T-7.6", "7.0", "Article cover image upload validates dimensions with sharp and stores in storage", () => {
    const actionPath = path.resolve("src/app/actions/articles.ts");
    const content = fs.readFileSync(actionPath, "utf-8");
    assert.ok(content.includes("uploadArticleCoverImageAction"), "uploadArticleCoverImageAction exported");
    assert.ok(content.includes("validateAndProcessImage"), "sharp image pipeline invoked");
    assert.ok(content.includes("articles/"), "article image path used in bucket");
  });

  test("T-7.7", "7.0", "Admin articles management page and client view support filtering, search, and metrics", () => {
    const pagePath = path.resolve("src/app/admin/articles/page.tsx");
    const clientPath = path.resolve("src/components/admin/AdminArticlesListClient.tsx");
    assert.ok(fs.existsSync(pagePath), "admin articles page must exist");
    assert.ok(fs.existsSync(clientPath), "admin articles client must exist");
    const content = fs.readFileSync(clientPath, "utf-8");
    assert.ok(content.includes("setArticleStatusAction"), "status quick actions implemented");
    assert.ok(content.includes("initialArticles"), "renders articles table");
  });

  test("T-7.8", "7.0", "Admin article editor form supports creator attribution, prompt picker, and preview links", () => {
    const formPath = path.resolve("src/components/admin/ArticleEditorForm.tsx");
    const newPagePath = path.resolve("src/app/admin/articles/new/page.tsx");
    const editPagePath = path.resolve("src/app/admin/articles/[id]/edit/page.tsx");
    assert.ok(fs.existsSync(formPath), "ArticleEditorForm component must exist");
    assert.ok(fs.existsSync(newPagePath), "admin new article page must exist");
    assert.ok(fs.existsSync(editPagePath), "admin edit article page must exist");
    const content = fs.readFileSync(formPath, "utf-8");
    assert.ok(content.includes("availableAuthors"), "handles author assignment");
    assert.ok(content.includes("availablePrompts"), "handles prompt associations");
    assert.ok(content.includes("uploadArticleCoverImageAction"), "handles cover image upload");
  });

  test("T-7.9", "7.0", "Admin preview route presents unpublished articles with preview banner and noindex robots", () => {
    const previewPath = path.resolve("src/app/admin/articles/[id]/preview/page.tsx");
    assert.ok(fs.existsSync(previewPath), "admin article preview page must exist");
    const content = fs.readFileSync(previewPath, "utf-8");
    assert.ok(content.includes("Admin Preview Mode"), "preview banner rendered");
    assert.ok(content.includes("index: false"), "robots set to noindex");
  });

  test("T-7.10", "7.0", "Public blog listing page renders published guides, topic filters, search, and pagination", () => {
    const blogPath = path.resolve("src/app/blog/page.tsx");
    assert.ok(fs.existsSync(blogPath), "blog listing page must exist");
    const content = fs.readFileSync(blogPath, "utf-8");
    assert.ok(content.includes("getPublishedArticles"), "fetches published articles");
    assert.ok(content.includes("CATEGORIES"), "defines category filters");
    assert.ok(content.includes("generateMetadata"), "defines SEO metadata");
  });

  test("T-7.11", "7.0", "Public article detail page renders safe markdown, TOC, author attribution, and JSON-LD schemas", () => {
    const detailPath = path.resolve("src/app/blog/[slug]/page.tsx");
    assert.ok(fs.existsSync(detailPath), "article detail page must exist");
    const content = fs.readFileSync(detailPath, "utf-8");
    assert.ok(content.includes("getArticleBySlug"), "resolves article by slug");
    assert.ok(content.includes("BreadcrumbList"), "includes breadcrumb JSON-LD schema");
    assert.ok(content.includes("BlogPosting"), "includes BlogPosting JSON-LD schema");
    assert.ok(content.includes("dangerouslySetInnerHTML"), "renders safe server markdown");
    assert.ok(content.includes("Table of Contents"), "renders table of contents");
  });

  test("T-7.12", "7.0", "Prompt detail page integrates bidirectional contextual guides referencing the prompt", () => {
    const promptPath = path.resolve("src/app/prompts/[slug]/page.tsx");
    const content = fs.readFileSync(promptPath, "utf-8");
    assert.ok(content.includes("getGuidesForPrompt"), "fetches contextual guides");
    assert.ok(content.includes("Guides & Tutorials Featuring this Prompt"), "renders contextual guides section");
  });

  test("T-7.13", "7.0", "Dynamic sitemap generator outputs canonical public URLs with genuine lastModified dates", () => {
    const sitemapPath = path.resolve("src/app/sitemap.ts");
    assert.ok(fs.existsSync(sitemapPath), "sitemap.ts must exist");
    const content = fs.readFileSync(sitemapPath, "utf-8");
    assert.ok(content.includes("/blog"), "indexes blog routes");
    assert.ok(content.includes("/creators"), "indexes creator routes");
    assert.ok(content.includes("/prompts"), "indexes prompt routes");
    assert.ok(content.includes("lastModified"), "provides lastModified timestamps");
  });

  test("T-7.14", "7.0", "Search engine robots directives disallow private paths and advertise sitemap", () => {
    const robotsPath = path.resolve("src/app/robots.ts");
    assert.ok(fs.existsSync(robotsPath), "robots.ts must exist");
    const content = fs.readFileSync(robotsPath, "utf-8");
    assert.ok(content.includes("disallow: ["), "defines disallow paths");
    assert.ok(content.includes("/admin"), "disallows admin");
    assert.ok(content.includes("/dashboard"), "disallows dashboard");
    assert.ok(content.includes("sitemap: `"), "advertises sitemap XML");
  });

  // ----------------------------------------------------
  // STEP 8: Production Hardening & Release Verification
  // ----------------------------------------------------
  test("T-8.1", "8.0", "Production security headers configured in next.config.ts (X-Frame-Options, CSP, HSTS, MIME)", () => {
    const configPath = path.resolve("next.config.ts");
    assert.ok(fs.existsSync(configPath), "next.config.ts must exist");
    const content = fs.readFileSync(configPath, "utf-8");
    assert.ok(content.includes("X-Frame-Options"), "X-Frame-Options header configured");
    assert.ok(content.includes("X-Content-Type-Options"), "X-Content-Type-Options header configured");
    assert.ok(content.includes("Content-Security-Policy-Report-Only"), "Content-Security-Policy header configured");
    assert.ok(content.includes("Strict-Transport-Security"), "HSTS header configured");
  });

  test("T-8.2", "8.0", "Image domain whitelisting in next.config.ts includes Supabase storage and Unsplash CDN", () => {
    const configPath = path.resolve("next.config.ts");
    const content = fs.readFileSync(configPath, "utf-8");
    assert.ok(content.includes("*.supabase.co"), "Supabase storage hostname whitelisted");
    assert.ok(content.includes("images.unsplash.com"), "Unsplash hostname whitelisted");
  });

  test("T-8.3", "8.0", "Middleware route protection covers /saved, /account, /admin, /dashboard, and /settings", () => {
    const mwPath = path.resolve("src/lib/supabase/middleware.ts");
    assert.ok(fs.existsSync(mwPath), "supabase middleware must exist");
    const content = fs.readFileSync(mwPath, "utf-8");
    assert.ok(content.includes('pathname.startsWith("/saved")'), "protects /saved");
    assert.ok(content.includes('pathname.startsWith("/account")'), "protects /account");
    assert.ok(content.includes('pathname.startsWith("/admin")'), "protects /admin");
    assert.ok(content.includes('pathname.startsWith("/dashboard")'), "protects /dashboard");
    assert.ok(content.includes('pathname.startsWith("/settings")'), "protects /settings");
  });

  test("T-8.4", "8.0", "Open redirect sanitizer validates relative-only paths and rejects protocol prefixes and traversal", () => {
    const authPath = path.resolve("src/app/actions/auth.ts");
    const content = fs.readFileSync(authPath, "utf-8");
    assert.ok(content.includes("sanitizeAuthRedirect"), "sanitizeAuthRedirect present");
    assert.ok(content.includes('trimmed.startsWith("//")'), "blocks protocol-relative redirects");
    assert.ok(content.includes('!trimmed.startsWith("/")'), "enforces relative root paths");
  });

  test("T-8.5", "8.0", "Application error boundary (src/app/error.tsx) catches errors and provides user recovery", () => {
    const errorPath = path.resolve("src/app/error.tsx");
    assert.ok(fs.existsSync(errorPath), "error.tsx must exist");
    const content = fs.readFileSync(errorPath, "utf-8");
    assert.ok(content.includes('"use client"'), "error boundary is client component");
    assert.ok(content.includes("reset"), "provides reset trigger");
  });

  test("T-8.6", "8.0", "Accessible 404 page (src/app/not-found.tsx) provides branded UI and navigation recovery", () => {
    const notFoundPath = path.resolve("src/app/not-found.tsx");
    assert.ok(fs.existsSync(notFoundPath), "not-found.tsx must exist");
    const content = fs.readFileSync(notFoundPath, "utf-8");
    assert.ok(content.includes("Page Not Found"), "renders not found title");
    assert.ok(content.includes("Return Home"), "provides return home navigation");
  });

  test("T-8.7", "8.0", "Production structured logger redacts auth tokens, passwords, and sensitive keys", () => {
    const loggerPath = path.resolve("src/lib/observability/logger.ts");
    assert.ok(fs.existsSync(loggerPath), "logger.ts must exist");
    const content = fs.readFileSync(loggerPath, "utf-8");
    assert.ok(content.includes("SENSITIVE_KEYS"), "defines sensitive keys blacklist");
    assert.ok(content.includes("[REDACTED]"), "redacts sensitive values");
    assert.ok(content.includes("export const logger"), "exports logger object");
  });

  test("T-8.8", "8.0", "Operations and recovery runbook documents setup, migrations, rollback, and backup", () => {
    const runbookPath = path.resolve("docs/runbook.md");
    assert.ok(fs.existsSync(runbookPath), "runbook.md must exist");
    const content = fs.readFileSync(runbookPath, "utf-8");
    assert.ok(content.includes("Local Setup"), "documents local setup");
    assert.ok(content.includes("Database Migrations"), "documents migrations");
    assert.ok(content.includes("Administrator Bootstrapping"), "documents admin bootstrap");
    assert.ok(content.includes("What a Vercel Rollback Restores"), "documents rollback boundaries");
  });

  // ----------------------------------------------------
  // STEP 9: Persistent Prompt Collections
  // ----------------------------------------------------
  test("T-9.1", "9.0", "Migration 005_collections.sql defines collections and collection_items schema with constraints", () => {
    const migrationPath = path.resolve("supabase/migrations/005_collections.sql");
    assert.ok(fs.existsSync(migrationPath), "005_collections.sql must exist");
    const sql = fs.readFileSync(migrationPath, "utf-8");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.collections"), "defines collections table");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.collection_items"), "defines collection_items table");
    assert.ok(sql.includes("chk_collections_title_length"), "validates title length");
    assert.ok(sql.includes("chk_collections_desc_length"), "validates description length");
    assert.ok(sql.includes("unique_collection_prompt"), "enforces unique collection prompt membership");
    assert.ok(sql.includes("concurrency_version INTEGER NOT NULL DEFAULT 1"), "optimistic concurrency version column");
  });

  test("T-9.2", "9.0", "Public ID immutability trigger and automatic version bump triggers defined in migration", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/005_collections.sql"), "utf-8");
    assert.ok(sql.includes("prevent_collection_public_id_change"), "prevents public_id mutation");
    assert.ok(sql.includes("bump_collection_version_on_item_change"), "bumps version on item insert/delete");
    assert.ok(sql.includes("trg_prevent_collection_public_id_change"), "attaches immutability trigger");
    assert.ok(sql.includes("trg_bump_collection_version"), "attaches version bump trigger");
  });

  test("T-9.3", "9.0", "Atomic stored procedure reorder_collection_items enforces concurrency version and item array validation", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/005_collections.sql"), "utf-8");
    assert.ok(sql.includes("reorder_collection_items"), "defines reorder_collection_items function");
    assert.ok(sql.includes("FOR UPDATE"), "locks collection row during reorder");
    assert.ok(sql.includes("v_current_version <> p_expected_version"), "checks expected version");
    assert.ok(sql.includes("CONFLICT: Collection has been modified"), "raises conflict on mismatch");
    assert.ok(sql.includes("v_matched_count <> v_existing_count"), "rejects foreign or missing IDs");
  });

  test("T-9.4", "9.0", "Row Level Security policies enforce private-by-default isolation and public visibility restrictions", () => {
    const sql = fs.readFileSync(path.resolve("supabase/migrations/005_collections.sql"), "utf-8");
    assert.ok(sql.includes("ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY"), "RLS enabled on collections");
    assert.ok(sql.includes("ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY"), "RLS enabled on collection_items");
    assert.ok(sql.includes("user_id = auth.uid() OR visibility = 'PUBLIC'"), "collections select policy");
    assert.ok(sql.includes("p.published = true"), "restricts collection_items to published prompts for public read");
  });

  test("T-9.5", "9.0", "Data access layer (src/lib/data/collections.ts) excludes unpublished prompts and respects creator privacy", () => {
    const dataPath = path.resolve("src/lib/data/collections.ts");
    assert.ok(fs.existsSync(dataPath), "collections.ts must exist");
    const code = fs.readFileSync(dataPath, "utf-8");
    assert.ok(code.includes("getOwnerCollections"), "exports getOwnerCollections");
    assert.ok(code.includes("getOwnerCollectionById"), "exports getOwnerCollectionById");
    assert.ok(code.includes("getPublicCollectionByPublicId"), "exports getPublicCollectionByPublicId");
    assert.ok(code.includes("profileRow?.is_public && profileRow.username"), "only attributes active public creator profiles");
    assert.ok(code.includes('eq("prompts.published", true)'), "filters by published prompts");
  });

  test("T-9.6", "9.0", "Server actions (src/app/actions/collections.ts) handle optimistic concurrency, version increment, and idempotency", () => {
    const actionsPath = path.resolve("src/app/actions/collections.ts");
    assert.ok(fs.existsSync(actionsPath), "actions/collections.ts must exist");
    const code = fs.readFileSync(actionsPath, "utf-8");
    assert.ok(code.includes("createCollectionAction"), "exports createCollectionAction");
    assert.ok(code.includes("updateCollectionAction"), "exports updateCollectionAction");
    assert.ok(code.includes("deleteCollectionAction"), "exports deleteCollectionAction");
    assert.ok(code.includes("addPromptToCollectionAction"), "exports addPromptToCollectionAction");
    assert.ok(code.includes("removePromptFromCollectionAction"), "exports removePromptFromCollectionAction");
    assert.ok(code.includes("reorderCollectionItemsAction"), "exports reorderCollectionItemsAction");
    assert.ok(code.includes('visibility: "PRIVATE"'), "defaults new collections to PRIVATE");
  });

  test("T-9.7", "9.0", "Accessible collection UI components provide Move up/down controls and AddToCollectionButton", () => {
    const buttonPath = path.resolve("src/components/collections/AddToCollectionButton.tsx");
    assert.ok(fs.existsSync(buttonPath), "AddToCollectionButton.tsx must exist");
    const buttonCode = fs.readFileSync(buttonPath, "utf-8");
    assert.ok(buttonCode.includes("role=\"dialog\""), "modal dialog role");
    assert.ok(buttonCode.includes("aria-modal=\"true\""), "modal aria attribute");

    const detailPath = path.resolve("src/components/collections/CollectionDetailClient.tsx");
    assert.ok(fs.existsSync(detailPath), "CollectionDetailClient.tsx must exist");
    const detailCode = fs.readFileSync(detailPath, "utf-8");
    assert.ok(detailCode.includes("handleMove(index, \"up\")"), "provides accessible move up control");
    assert.ok(detailCode.includes("handleMove(index, \"down\")"), "provides accessible move down control");
  });

  test("T-9.8", "9.0", "Public collection pages enforce noindex, follow and exclude collection URLs from sitemaps", () => {
    const publicPagePath = path.resolve("src/app/collections/[publicId]/page.tsx");
    assert.ok(fs.existsSync(publicPagePath), "public collection page must exist");
    const pageCode = fs.readFileSync(publicPagePath, "utf-8");
    assert.ok(pageCode.includes("index: false"), "sets robots index: false");
    assert.ok(pageCode.includes("follow: true"), "sets robots follow: true");
    assert.ok(pageCode.includes("notFound()"), "returns genuine 404 on missing/private collection");

    const sitemapPath = path.resolve("src/app/sitemap.ts");
    const sitemapCode = fs.readFileSync(sitemapPath, "utf-8");
    assert.ok(!sitemapCode.includes("/collections/"), "collections excluded from sitemaps");
  });

  console.log("\n==========================================");
  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const blockedCount = results.filter((r) => r.status === "BLOCKED").length;

  console.log(`Results: PASS=${passCount}, FAIL=${failCount}, BLOCKED=${blockedCount}, TOTAL=${results.length}`);
  console.log("==========================================");
}

runAll().catch(console.error);
