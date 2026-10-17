"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeUsername,
  validateUsername,
  validateDisplayName,
  validateBio,
  validateWebsiteUrl,
} from "@/lib/creators/profiles";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Updates the authenticated user's creator profile.
 * Enforces username validation, reservation checks, length constraints, and URL protocols.
 */
export async function updateCreatorProfileAction(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: "Database client is not available." };
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required to update profile." };
    }

    // 1. Fetch current profile state
    const { data: currentProfile, error: fetchErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchErr) {
      return { success: false, error: "Failed to load existing profile." };
    }

    const requestedUsernameRaw = (formData.get("username") as string)?.trim() || "";
    const displayName = (formData.get("displayName") as string)?.trim() || null;
    const bio = (formData.get("bio") as string)?.trim() || null;
    const websiteUrl = (formData.get("websiteUrl") as string)?.trim() || null;
    const isPublic = formData.get("isPublic") === "true";

    // 2. Validate Display Name, Bio, and Website URL
    const nameCheck = validateDisplayName(displayName);
    if (!nameCheck.valid) return { success: false, error: nameCheck.error };

    const bioCheck = validateBio(bio);
    if (!bioCheck.valid) return { success: false, error: bioCheck.error };

    const websiteCheck = validateWebsiteUrl(websiteUrl);
    if (!websiteCheck.valid) return { success: false, error: websiteCheck.error };

    // 3. Username validation & immutability rule
    let finalUsername: string | null = currentProfile?.username || null;

    if (requestedUsernameRaw) {
      const normalizedReq = normalizeUsername(requestedUsernameRaw);

      if (currentProfile?.username) {
        // If username was already set, username is immutable in this step
        if (normalizeUsername(currentProfile.username) !== normalizedReq) {
          return {
            success: false,
            error: "Username is immutable once set and cannot be changed in this step.",
          };
        }
      } else {
        // Setting username for the first time
        const userCheck = validateUsername(normalizedReq);
        if (!userCheck.valid) {
          return { success: false, error: userCheck.error };
        }

        // Check uniqueness in database (case-insensitive)
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", normalizedReq)
          .neq("id", user.id)
          .maybeSingle();

        if (existingUser) {
          return {
            success: false,
            error: `The username "${normalizedReq}" is already registered. Please choose another username.`,
          };
        }

        finalUsername = normalizedReq;
      }
    }

    // Public profiles require a username
    if (isPublic && !finalUsername) {
      return {
        success: false,
        error: "A valid unique username is required before enabling your public creator profile.",
      };
    }

    // 4. Update profiles record
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        username: finalUsername,
        display_name: displayName,
        bio,
        website_url: websiteUrl,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateErr) {
      console.error("updateCreatorProfileAction error:", updateErr);
      return { success: false, error: `Failed to update profile: ${updateErr.message}` };
    }

    revalidatePath("/settings/profile");
    revalidatePath("/account");
    revalidatePath("/creators");
    if (finalUsername) {
      revalidatePath(`/creators/${finalUsername}`);
    }

    return { success: true };
  } catch (err) {
    console.error("updateCreatorProfileAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}
