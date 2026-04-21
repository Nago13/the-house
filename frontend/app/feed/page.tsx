"use client";
import { useEffect, useRef, useState } from "react";
import FeedCard from "@/components/FeedCard";
import type { FeedPost } from "@/lib/types";

const REVEAL_INTERVAL_MS = 3000;
const TOTAL_CONTESTANTS = 10;
const PURPLE = "#8B5CF6";
const BORDER = "rgba(139,92,246,0.18)";

let globalPostIndex = 0;
let globalShuffledPosts: FeedPost[] = [];

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomOnline() {
  return 5 + Math.floor(Math.random() * 5);
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [online, setOnline] = useState(() => 6 + Math.floor(Math.random() * 3));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (globalShuffledPosts.length > 0) {
      setPosts(globalShuffledPosts.slice(0, Math.max(globalPostIndex, 3)));
      setLoaded(true);
      return;
    }
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data: FeedPost[]) => {
        const seed = Math.floor(Date.now() / 1000 / 3600);
        globalShuffledPosts = seededShuffle(data as FeedPost[], seed);
        globalPostIndex = Math.max(globalPostIndex, 3);
        setPosts(globalShuffledPosts.slice(0, globalPostIndex));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded || globalShuffledPosts.length === 0) return;
    intervalRef.current = setInterval(() => {
      if (globalPostIndex >= globalShuffledPosts.length) {
        clearInterval(intervalRef.current!);
        return;
      }
      const next = globalShuffledPosts[globalPostIndex];
      globalPostIndex += 1;
      setNewIds((ids) => new Set(Array.from(ids).concat(next.id)));
      setTimeout(() => {
        setNewIds((ids) => { const s = new Set(ids); s.delete(next.id); return s; });
      }, 1000);
      setPosts(globalShuffledPosts.slice(0, globalPostIndex));
    }, REVEAL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current!);
  }, [loaded]);

  useEffect(() => {
    function scheduleNext() {
      const delay = 30000 + Math.random() * 15000;
      return setTimeout(() => {
        setOnline(randomOnline());
        scheduleNext();
      }, delay);
    }
    const t = scheduleNext();
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="max-w-xl mx-auto">
      {/* header */}
      <div
        className="sticky top-14 z-10 px-5 py-4 flex items-center justify-between"
        style={{
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase font-mono mb-0.5" style={{ color: PURPLE }}>
            Live Feed
          </p>
          <h1 className="font-bold text-lg text-white tracking-tight">
            WHAT ARE THEY SAYING
          </h1>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ border: `1px solid ${BORDER}`, background: "rgba(139,92,246,0.08)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
          <span className="font-mono text-xs font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
            {online}/{TOTAL_CONTESTANTS}
          </span>
        </div>
      </div>

      {/* posts */}
      {!loaded ? (
        <div className="p-12 text-center font-mono text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
          Loading feed...
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center font-mono text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
          No posts yet. Check back soon.
        </div>
      ) : (
        <div>
          {[...posts].reverse().map((post) => (
            <FeedCard key={post.id} post={post} isNew={newIds.has(post.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
