import type { FeedPost } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { Heart, Repeat2, MessageCircle } from "lucide-react";

interface Props {
  post: FeedPost;
  isNew?: boolean;
}

const BORDER = "rgba(139,92,246,0.18)";
const PURPLE = "#8B5CF6";

export default function FeedCard({ post, isNew }: Props) {
  const time = new Date(post.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      className={`transition-all ${isNew ? "animate-fade-in" : ""}`}
      style={{
        borderBottom: `1px solid ${BORDER}`,
        background: isNew ? "rgba(139,92,246,0.04)" : "transparent",
      }}
    >
      <div className="px-5 py-4 flex gap-3 hover:bg-white/[0.02] transition-colors">
        {/* avatar */}
        <Link href={`/profile/${post.author_address}`} className="flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full overflow-hidden"
            style={{ border: `1.5px solid ${BORDER}` }}
          >
            <Image
              src={post.avatar_url}
              alt={post.author_name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
              onError={() => {}}
            />
          </div>
        </Link>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href={`/profile/${post.author_address}`}
              className="font-semibold text-sm transition-colors hover:opacity-80"
              style={{ color: "#fff" }}
            >
              {post.author_name}
            </Link>
            <span
              className="font-mono text-xs"
              style={{ color: PURPLE }}
            >
              ${post.author_ticker}
            </span>
            <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.35)" }}>
              {time}
            </span>
          </div>

          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.75)" }}>
            {post.content}
          </p>

          {/* reactions */}
          <div className="flex gap-5 mt-3">
            {[
              { Icon: Heart,         count: post.reactions.like,   label: "likes"   },
              { Icon: Repeat2,       count: post.reactions.repost, label: "reposts" },
              { Icon: MessageCircle, count: post.reactions.reply,  label: "replies" },
            ].map(({ Icon, count, label }) => (
              <button
                key={label}
                className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.35)" }}
                aria-label={label}
              >
                <Icon size={13} />
                <span>{count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
