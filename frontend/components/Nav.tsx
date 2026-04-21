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

const PURPLE = "#8B5CF6";
const PURPLE_DIM = "rgba(139,92,246,0.15)";
const BORDER = "rgba(139,92,246,0.2)";

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6"
      style={{
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <Link
        href="/"
        className="font-mono font-bold text-sm tracking-[0.25em] uppercase"
        style={{ color: PURPLE }}
      >
        THE HOUSE
      </Link>

      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 text-sm rounded-lg transition-colors font-mono"
              style={{
                color: active ? PURPLE : "rgba(255,255,255,0.5)",
                background: active ? PURPLE_DIM : "transparent",
              }}
            >
              {label}
            </Link>
          );
        })}

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors font-mono flex items-center gap-1"
            style={{
              color: path.startsWith("/profile") || path.startsWith("/chat") ? PURPLE : "rgba(255,255,255,0.5)",
              background: path.startsWith("/profile") || path.startsWith("/chat") ? PURPLE_DIM : "transparent",
            }}
          >
            Cast
            <span className="text-[10px] opacity-60">{open ? "▲" : "▼"}</span>
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-1 w-56 rounded-2xl overflow-hidden z-50"
              style={{
                background: "rgba(5,5,5,0.97)",
                border: `1px solid ${BORDER}`,
                backdropFilter: "blur(20px)",
                boxShadow: `0 8px 40px rgba(139,92,246,0.15)`,
              }}
              onMouseLeave={() => setOpen(false)}
            >
              {contestants.map((c) => {
                const isActive = path.includes(c.token_address);
                return (
                  <Link
                    key={c.token_address}
                    href={`/profile/${c.token_address}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{
                      color: isActive ? PURPLE : "rgba(255,255,255,0.6)",
                      background: isActive ? PURPLE_DIM : "transparent",
                    }}
                  >
                    <span className="font-mono text-xs opacity-60 w-16 truncate">${c.ticker}</span>
                    <span className="truncate">{c.name}</span>
                    {c.generation > 0 && (
                      <span className="ml-auto text-[9px] font-mono opacity-40">G{c.generation}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: PURPLE }} />
        <span className="font-mono text-xs font-bold tracking-widest" style={{ color: PURPLE }}>LIVE</span>
      </div>
    </header>
  );
}
