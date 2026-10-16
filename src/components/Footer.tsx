import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-surface-border bg-surface text-text-muted mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand info */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-foreground"
              aria-label={`${siteConfig.name} Home`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-base font-extrabold">{siteConfig.name}</span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-text-faint">
              {siteConfig.description}
            </p>
            <div className="mt-4 text-[11px] text-text-faint">
              Built with Next.js App Router, Tailwind CSS, & TypeScript.
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Product
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              {siteConfig.footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Resources
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              {siteConfig.footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal and Disclaimer */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Transparency
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-text-faint">
              PromptNest is an independent prompt engineering index. All showcase images are credited to their respective photographers and licensed under open Unsplash terms.
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              {siteConfig.footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-surface-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-text-faint">
          <div>
            © 2026 {siteConfig.name}. Step 1 Foundation & Showcase.
          </div>
          <div className="flex items-center gap-4">
            <a
              href={siteConfig.socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href={siteConfig.socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Twitter / X
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
