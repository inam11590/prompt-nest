"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CreatorProfile } from "@/lib/creators/profiles";
import { updateCreatorProfileAction } from "@/app/actions/creator-profile";
import {
  User,
  Globe,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface ProfileSettingsFormProps {
  initialProfile: CreatorProfile | null;
}

export function ProfileSettingsForm({ initialProfile }: ProfileSettingsFormProps) {
  const router = useRouter();

  const [username, setUsername] = useState(initialProfile?.username || "");
  const [displayName, setDisplayName] = useState(initialProfile?.displayName || "");
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [websiteUrl, setWebsiteUrl] = useState(initialProfile?.websiteUrl || "");
  const [isPublic, setIsPublic] = useState(initialProfile?.isPublic || false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isUsernameLocked = Boolean(initialProfile?.username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("displayName", displayName);
    formData.append("bio", bio);
    formData.append("websiteUrl", websiteUrl);
    formData.append("isPublic", String(isPublic));

    const res = await updateCreatorProfileAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage("Your creator profile has been updated successfully.");
      router.refresh();
    } else {
      setErrorMessage(res.error || "Failed to update creator profile.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Update Failed</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-200">Profile Updated</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-white">Public Creator Identity</h2>
          <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
            Configure your public presence on PromptNest. Creator profiles are strictly opt-in;
            activating your public profile allows you to submit prompts for editorial review and be featured in the Creator Directory.
          </p>
        </div>

        {/* Username */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="settings-username" className="block text-xs font-medium text-foreground">
              Unique Username <span className="text-rose-400">*</span>
            </label>
            {isUsernameLocked && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                <Lock className="h-3 w-3" />
                Locked
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center rounded-l-xl border border-r-0 border-surface-border bg-surface-raised px-3 py-2.5 text-xs text-foreground-muted font-mono">
              @
            </span>
            <input
              id="settings-username"
              type="text"
              required
              disabled={isUsernameLocked}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
              placeholder="artisan_ai"
              className={`w-full rounded-r-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                isUsernameLocked ? "opacity-60 cursor-not-allowed bg-surface" : ""
              }`}
            />
          </div>
          <p className="text-[11px] text-foreground-muted mt-1.5">
            {isUsernameLocked
              ? "Usernames are permanent once established to ensure persistent creator permalinks."
              : "3-30 lowercase characters, numbers, and underscores only. Cannot be changed once set."}
          </p>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="settings-display-name" className="block text-xs font-medium text-foreground mb-1.5">
            Display Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              id="settings-display-name"
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Alex Rivera"
              className="w-full rounded-xl border border-surface-border bg-surface-raised pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div className="flex justify-between text-[11px] text-foreground-muted mt-1">
            <span>Name shown alongside your prompts.</span>
            <span>{displayName.length}/50</span>
          </div>
        </div>

        {/* Biography */}
        <div>
          <label htmlFor="settings-bio" className="block text-xs font-medium text-foreground mb-1.5">
            Biography (Plain Text)
          </label>
          <div className="relative">
            <textarea
              id="settings-bio"
              rows={4}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Visual artist and prompt engineer specializing in cinematic sci-fi and architectural concepts..."
              className="w-full rounded-xl border border-surface-border bg-surface-raised p-4 text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
            />
          </div>
          <div className="flex justify-between text-[11px] text-foreground-muted mt-1">
            <span>Plain text only. No HTML or markdown tags.</span>
            <span>{bio.length}/500</span>
          </div>
        </div>

        {/* Website URL */}
        <div>
          <label htmlFor="settings-website" className="block text-xs font-medium text-foreground mb-1.5">
            Portfolio / Website Link
          </label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              id="settings-website"
              type="url"
              maxLength={200}
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourportfolio.com"
              className="w-full rounded-xl border border-surface-border bg-surface-raised pl-10 pr-4 py-2.5 text-sm text-foreground font-mono placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <p className="text-[11px] text-foreground-muted mt-1">
            Must use a secure HTTPS link. Maximum 200 characters.
          </p>
        </div>

        {/* Public Profile Switch */}
        <div className="pt-4 border-t border-surface-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Enable Public Creator Profile</p>
              <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">
                When enabled, your profile and published prompts will be visible in the public Creator Directory at{" "}
                <code className="text-indigo-400 font-mono">/creators/{username || "username"}</code>.
                When disabled, your creator profile is hidden.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isPublic ? "bg-indigo-600" : "bg-surface-raised border-surface-border"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isPublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex items-center justify-between">
          {initialProfile?.username && initialProfile?.isPublic ? (
            <Link
              href={`/creators/${initialProfile.username}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              <Eye className="h-3.5 w-3.5" />
              View Your Public Profile
            </Link>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Save Profile Settings
          </button>
        </div>
      </div>
    </form>
  );
}
