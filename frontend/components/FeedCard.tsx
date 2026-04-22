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
              {post.content}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
