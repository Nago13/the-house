"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import contestants from "@/lib/contestants";

const NAV_LINKS = [
  { href: "/feed",  label: "Feed"  },
  { href: "/tree",  label: "Tree"  },
  { href: "/birth", label: "Birth" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-house-border bg-house-bg/90 backdrop-blur-sm flex items-center justify-between px-6">
      <Link href="/" className="font-mono font-bold text-house-amber tracking-widest text-sm">
        THE HOUSE
      </Link>

      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 text-sm rounded transition-colors font-mono ${
                active
                  ? "text-house-amber bg-house-amber/10"
                  : "text-house-muted hover:text-house-text"
              }`}
            >
              {label}
            </Link>
          );
        })}

        {/* Contestants dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded transition-colors font-mono flex items-center gap-1 ${
              path.startsWith("/profile") || path.startsWith("/chat")
                ? "text-house-amber bg-house-amber/10"
                : "text-house-muted hover:text-house-text"
            }`}
          >
            Cast
            <span className="text-[10px] opacity-60">{open ? "▲" : "▼"}</span>
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-house-border bg-house-bg/95 backdrop-blur-sm shadow-xl overflow-hidden z-50"
              onMouseLeave={() => setOpen(false)}
            >
              {contestants.map((c) => {
                const isActive = path.includes(c.token_address);
                return (
                  <Link
                    key={c.token_address}
                    href={`/profile/${c.token_address}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "text-house-amber bg-house-amber/10"
                        : "text-house-muted hover:text-house-text hover:bg-white/5"
                    }`}
                  >
                    <span className="font-mono text-xs opacity-60 w-16 truncate">${c.ticker}</span>
                    <span className="truncate">{c.name}</span>
                    {c.generation > 0 && (
                      <span className="ml-auto text-[9px] font-mono opacity-50">G{c.generation}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-house-live animate-pulse-live" />
        <span className="font-mono text-house-live text-xs font-bold tracking-widest">LIVE</span>
      </div>
    </header>
  );
}
