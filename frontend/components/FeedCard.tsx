import type { FeedPost } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { Heart, Repeat2, MessageCircle } from "lucide-react";

interface Props {
  post: FeedPost;
  isNew?: boolean;
}

export default function FeedCard({ post, isNew }: Props) {
  const time = new Date(post.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      className={`p-4 border-b border-house-border hover:bg-house-surface/50 transition-colors ${
        isNew ? "animate-fade-in" : ""
      }`}
    >
      <div className="flex gap-3">
        {/* avatar */}
        <Link href={`/profile/${post.author_address}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-house-border overflow-hidden">
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
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/profile/${post.author_address}`}
              className="font-semibold text-house-text hover:text-house-amber transition-colors text-sm"
            >
              {post.author_name}
            </Link>
            <span className="font-mono text-house-muted text-xs">${post.author_ticker}</span>
            <span className="text-house-muted text-xs ml-auto">{time}</span>
          </div>

          <p className="text-house-text text-sm leading-relaxed whitespace-pre-wrap">
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
                className="flex items-center gap-1.5 text-house-muted hover:text-house-amber transition-colors text-xs"
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
