"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/feed",  label: "Feed"  },
  { href: "/tree",  label: "Tree"  },
  { href: "/birth", label: "Birth" },
  { href: "/profile/0x2A9796Be8C555558d10079E53FB35A2e5dA6a317", label: "MOM"  },
  { href: "/profile/0x74A69d5999da4f187c3d318c1850081E76cFa849", label: "DAD"  },
  { href: "/profile/0xB203132692E11536863fAd7e650c17e2f0A317e9", label: "GNSP" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-house-border bg-house-bg/90 backdrop-blur-sm flex items-center justify-between px-6">
      <Link href="/" className="font-mono font-bold text-house-amber tracking-widest text-sm">
        THE HOUSE
      </Link>

      <nav className="flex items-center gap-1">
        {links.map(({ href, label }) => {
          const active = path.startsWith(href) && href !== "/" ;
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
      </nav>

      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-house-live animate-pulse-live" />
        <span className="font-mono text-house-live text-xs font-bold tracking-widest">LIVE</span>
      </div>
    </header>
  );
}
