"use client";
import { useEffect, useRef, useState } from "react";
import FeedCard from "@/components/FeedCard";
import type { FeedPost } from "@/lib/types";

const REVEAL_MS = 3000;

let globalIdx = 0;
let globalPosts: FeedPost[] = [];

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]; let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FeedPage() {
  const [posts,  setPosts]  = useState<FeedPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [online, setOnline] = useState(() => 6 + Math.floor(Math.random() * 4));
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (globalPosts.length > 0) {
      setPosts(globalPosts.slice(0, Math.max(globalIdx, 3)));
      setLoaded(true); return;
    }
    fetch("/api/posts").then(r => r.json()).then((data: FeedPost[]) => {
      const seed = Math.floor(Date.now() / 1000 / 3600);
      globalPosts = seededShuffle(data, seed);
      globalIdx   = Math.max(globalIdx, 3);
      setPosts(globalPosts.slice(0, globalIdx));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded || globalPosts.length === 0) return;
    ivRef.current = setInterval(() => {
      if (globalIdx >= globalPosts.length) { clearInterval(ivRef.current!); return; }
      const next = globalPosts[globalIdx++];
      setNewIds(ids => new Set([...ids, next.id]));
      setTimeout(() => setNewIds(ids => { const s = new Set(ids); s.delete(next.id); return s; }), 1200);
      setPosts(globalPosts.slice(0, globalIdx));
    }, REVEAL_MS);
    return () => clearInterval(ivRef.current!);
  }, [loaded]);

  useEffect(() => {
    const tick = () => setTimeout(() => { setOnline(5 + Math.floor(Math.random() * 6)); tick(); }, 30000 + Math.random() * 20000);
    const t = tick(); return () => clearTimeout(t as unknown as number);
  }, []);

  return (
    <div className="max-w-xl mx-auto">
      {/* sticky header */}
      <div
        className="sticky top-14 z-10 px-5 py-4 flex items-center justify-between"
        style={{
          background: "rgba(7,6,10,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(245,200,66,0.1)",
        }}
      >
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase font-mono mb-0.5" style={{ color: "#F5C842" }}>
            Live Feed
          </p>
          <h1 className="font-display text-xl text-white tracking-tight">
            Live from inside the house.
          </h1>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ border: "1px solid rgba(245,200,66,0.15)", background: "rgba(245,200,66,0.05)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
          <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
            {online} online
          </span>
        </div>
      </div>

      <div className="py-4">
        {!loaded ? (
          <div className="p-12 text-center font-mono text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
            Loading feed...
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center font-mono text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
            No transmissions yet.
          </div>
        ) : (
          [...posts].reverse().map(post => (
            <FeedCard key={post.id} post={post} isNew={newIds.has(post.id)} />
          ))
        )}
      </div>
    </div>
  );
}
