"use client";
import { useEffect, useRef, useState } from "react";
import FeedCard from "@/components/FeedCard";
import type { FeedPost } from "@/lib/types";

const REVEAL_INTERVAL_MS = 3000;
const TOTAL_CONTESTANTS = 10;

// Persists across route changes within the same session
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
  return 5 + Math.floor(Math.random() * 5); // 5–9
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [online, setOnline] = useState(() => 6 + Math.floor(Math.random() * 3)); // 6–8 initial
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load posts once, shuffle once per session
  useEffect(() => {
    if (globalShuffledPosts.length > 0) {
      // Resume from saved index
      setPosts(globalShuffledPosts.slice(0, Math.max(globalPostIndex, 3)));
      setLoaded(true);
      return;
    }
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data: FeedPost[]) => {
        const seed = Math.floor(Date.now() / 1000 / 3600); // changes hourly
        globalShuffledPosts = seededShuffle(data as FeedPost[], seed);
        globalPostIndex = Math.max(globalPostIndex, 3);
        setPosts(globalShuffledPosts.slice(0, globalPostIndex));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Reveal posts progressively
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

  // Online count changes every 30–45 seconds
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
      <div className="sticky top-14 z-10 bg-house-bg/90 backdrop-blur border-b border-house-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-mono font-bold text-xs tracking-widest uppercase text-house-text">
          Live Feed
        </h1>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono text-white text-xs font-bold">
            {online}/{TOTAL_CONTESTANTS} online
          </span>
        </div>
      </div>

      {/* posts */}
      {!loaded ? (
        <div className="p-8 text-center text-house-muted font-mono text-xs">Loading feed...</div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-house-muted font-mono text-xs">
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
