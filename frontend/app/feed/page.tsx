"use client";
import { useEffect, useState } from "react";
import FeedCard from "@/components/FeedCard";
import type { FeedPost } from "@/lib/types";

// Posts loaded from static JSON — progressively revealed every 8s
// TODO [Hours 5-8]: replace with real content/posts.json (pre-generated via Claude)
const REVEAL_INTERVAL_MS = 8000;

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [allPosts, setAllPosts] = useState<FeedPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data: FeedPost[]) => {
        // Sort by timestamp ascending — reveal in chronological order
        const sorted = [...data].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setAllPosts(sorted);
        // Show first 3 immediately
        setPosts(sorted.slice(0, 3));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded || allPosts.length === 0) return;
    const interval = setInterval(() => {
      setPosts((prev) => {
        if (prev.length >= allPosts.length) {
          clearInterval(interval);
          return prev;
        }
        const next = allPosts[prev.length];
        setNewIds((ids) => new Set(Array.from(ids).concat(next.id)));
        setTimeout(() => {
          setNewIds((ids) => { const s = new Set(ids); s.delete(next.id); return s; });
        }, 1000);
        return [...prev, next];
      });
    }, REVEAL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loaded, allPosts]);

  return (
    <div className="max-w-xl mx-auto">
      {/* header */}
      <div className="sticky top-14 z-10 bg-house-bg/90 backdrop-blur border-b border-house-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-mono font-bold text-xs tracking-widest uppercase text-house-text">
          Live Feed
        </h1>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-house-live animate-pulse-live" />
          <span className="font-mono text-house-live text-xs font-bold">
            {posts.length} / {allPosts.length || "—"} posts
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
