import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Checks if a given user (or the currently authenticated user) has verified administrator privileges.
 * Performs server-side validation against the private public.admin_users role table and is_admin function.
 * Never trusts client metadata, session claims, or cookies alone.
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) {
    return false;
  }

  let targetId = userId;

  if (!targetId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return false;
    }
    targetId = user.id;
  }

  try {
    // 1. First attempt: call security definer helper is_admin(uuid)
    const { data: isRpcAdmin, error: rpcError } = await supabase.rpc("is_admin", {
      user_id: targetId,
    });

    if (!rpcError && typeof isRpcAdmin === "boolean") {
      return isRpcAdmin;
    }

    // 2. Direct query against public.admin_users
    const { data, error: tableError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", targetId)
      .maybeSingle();

    if (!tableError && data?.user_id) {
      return true;
    }

    return false;
  } catch (err) {
    console.error("Error verifying admin authorization:", err);
    return false;
  }
}

/**
 * Validates that the current request is from an authenticated administrator.
 * Returns the authenticated user object or throws an authorization error.
 */
export async function requireAdmin(): Promise<{ user: User }> {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error("UNAUTHORIZED: Database client not configured.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("UNAUTHORIZED: Authentication required.");
  }

  const authorized = await isAdmin(user.id);
  if (!authorized) {
    throw new Error("FORBIDDEN: Administrator access required.");
  }

  return { user };
}

/**
 * Retrieves the current session user along with verified administrator status.
 */
export async function getAdminSession(): Promise<{ user: User; isAdmin: boolean } | null> {
  const supabase = await createClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const admin = await isAdmin(user.id);
  return {
    user,
    isAdmin: admin,
  };
}
