import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Creates an async Server Component Supabase client using @supabase/ssr.
 * Safely accesses cookies using Next.js App Router cookies().
 * Returns null if Supabase environment variables are unconfigured.
 */
export async function createClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  const cookieStore = await cookies();


  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Creates an authenticated Service Role client for administrative tasks (e.g. seeding).
 * NEVER expose this client or SUPABASE_SERVICE_ROLE_KEY to browser bundles.
 */
export function createAdminClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  return createServerClient<Database>(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}

/**
 * Creates a cookie-free anonymous Supabase client for public read queries.
 * Prevents triggering dynamic cookies() during static prerendering in Next.js 16.
 */
export function createPublicClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}

