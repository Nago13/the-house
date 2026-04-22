"use client";
import Image from "next/image";
import Link from "next/link";
import type { FeedPost } from "@/lib/types";

const TICKER_COLORS: Record<string, string> = {
  MOM:      "#F5C842",
  DAD:      "#A855F7",
  GNSP:     "#F59E0B",
  SHIB:     "#FF6B2B",
  DOGE:     "#C9A84C",
  PEPE:     "#22c55e",
  FLOKI:    "#60a5fa",
  PENGU:    "#93c5fd",
  FARTCOIN: "#84cc16",
  PHNIX:    "#f97316",
  PENKI:    "#93c5fd",
  PHARTNIX: "#f97316",
  DOPE:     "#22c55e",
  PHARKI:   "#a78bfa",
};

const TICKER_ADDRESSES: Record<string, string> = {
  MOM:      "0x2A9796Be8C555558d10079E53FB35A2e5dA6a317",
  DAD:      "0x74A69d5999da4f187c3d318c1850081E76cFa849",
  GNSP:     "0xB203132692E11536863fAd7e650c17e2f0A317e9",
  SHIB:     "0x2859e4544C4bB03966803b044A93563Bd2D0DD4D",
  DOGE:     "0xbA2aE424d960c26247Dd6c32edC70B295c744C43",
  PEPE:     "0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00",
  FLOKI:    "0xfb5B838b6cfEEdC2873aB27866079AC55363D37",
  PENGU:    "0xdd81F1B6820C86984C0374C6483CB2c8c169477F",
  FARTCOIN: "0x2bb57189099a6409E369918B9958e7f62e9A2f81",
  PHNIX:    "0x6b94FB6591141Ff8ba29654644f6b35f94aE06D5",
  PENKI:    "0xd345f9E8a6241C0635339c8FCB68535042C81cB3",
  PHARTNIX: "0x119EDD3B7c06D6fF165370bb0A755197Ffa97feB",
  DOPE:     "0xB112511655616aE15c4dc1a1E7dF65506e843748",
  PHARKI:   "0x2b065F3E892Da24367De75b3c05bb47Aeac50c81",
};

function renderContent(content: string) {
  const parts = content.split(/(@\$[A-Z]+)/g);
  return parts.map((part, i) => {
    const match = part.match(/^@\$([A-Z]+)$/);
    if (match) {
      const ticker = match[1];
      const color  = TICKER_COLORS[ticker] ?? "#A855F7";
      const addr   = TICKER_ADDRESSES[ticker];
      const inner  = <span style={{ color, fontWeight: 600 }}>{part}</span>;
      return addr
        ? <Link key={i} href={`/profile/${addr}`} onClick={(e) => e.stopPropagation()}>{inner}</Link>
        : <span key={i}>{inner}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

interface Props { post: FeedPost; isNew?: boolean; }

export default function FeedCard({ post, isNew }: Props) {
  const color = TICKER_COLORS[post.author_ticker] ?? "#A855F7";

  return (
    <Link href={`/profile/${post.author_address}`} className="block group">
      <div
        className="relative mx-4 mb-3 rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: "#0D0D14",
          border: `1px solid ${isNew ? color + "55" : color + "18"}`,
          boxShadow: isNew ? `0 0 24px ${color}18` : "none",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${color}66, transparent)` }}
        />
        <div className="p-4 flex gap-3">
          <div className="rounded-xl overflow-hidden flex-shrink-0 mt-0.5"
            style={{ width: 36, height: 36, border: `1.5px solid ${color}33` }}
          >
            <Image src={post.avatar_url} alt={post.author_name} width={36} height={36}
              className="object-cover w-full h-full" onError={() => {}} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] tracking-[0.2em] uppercase font-mono font-bold" style={{ color }}>
                ${post.author_ticker}
              </span>
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                {post.author_name}
              </span>
              <span className="ml-auto text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
                {timeAgo(post.timestamp)}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
              {renderContent(post.content)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
