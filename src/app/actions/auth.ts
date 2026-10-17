"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Validates redirect target against safe same-origin application paths.
 */
function sanitizeAuthRedirect(path?: string | null): string {
  if (!path) return "/account";
  const trimmed = path.trim();
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("\\\\") ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  ) {
    return "/account";
  }
  if (!trimmed.startsWith("/")) return "/account";
  return trimmed;
}

export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const returnTo = sanitizeAuthRedirect(formData.get("returnTo") as string);

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Authentication service is unconfigured." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  redirect(returnTo);
}

export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Authentication service is unconfigured." };
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        display_name: displayName?.trim() || splitEmail(email),
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: "Registration successful! Please check your email to confirm your account.",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  if (!email) {
    return { success: false, error: "Email is required." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Authentication service is unconfigured." };
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Generic response to mitigate account enumeration
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  return {
    success: true,
    message: "If an account exists with that email, a password reset link has been sent.",
  };
}

export async function updatePasswordAction(formData: FormData): Promise<AuthActionResult> {
  const password = formData.get("password") as string;
  if (!password || password.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Authentication service is unconfigured." };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: "Password updated successfully. You can now use your new password.",
  };
}

function splitEmail(email: string): string {
  return email.split("@")[0] || "User";
}
