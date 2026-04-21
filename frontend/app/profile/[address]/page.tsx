import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getContestant } from "@/lib/contestants";
import TraitBar from "@/components/TraitBar";

interface Props {
  params: Promise<{ address: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { address } = await params;
  const c = getContestant(address);
  if (!c) notFound();

  const tickerColor =
    c.ticker === "MOM"   ? "text-house-mom"   :
    c.ticker === "DAD"   ? "text-house-dad"   :
    c.ticker === "CHILD" ? "text-house-child" :
    "text-house-amber";

  const isMom = c.ticker === "MOM";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex gap-6 mb-8">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-house-border overflow-hidden flex-shrink-0">
          <Image
            src={c.portrait_url}
            alt={c.name}
            width={128}
            height={128}
            className="object-cover w-full h-full"
            onError={() => {}}
          />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-2xl font-bold mb-1">{c.name}</h1>
          <p className={`font-mono text-sm font-bold mb-1 ${tickerColor}`}>
            ${c.ticker}
          </p>
          <p className="font-mono text-house-muted text-xs">
            Gen {c.generation}
            {c.genesis_archetype && ` · ${c.genesis_archetype.split("—")[0].trim()}`}
          </p>
          <p className="font-mono text-xs text-house-border mt-1 truncate max-w-xs">
            {c.token_address}
            {c.mock_deploy && (
              <span className="ml-2 text-house-amber">[testnet]</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Signature phrase ───────────────────────────────── */}
      <blockquote className="border-l-2 border-house-amber pl-4 mb-8 italic text-house-muted">
        &ldquo;{c.signature_phrase}&rdquo;
      </blockquote>

      {/* ── Traits ─────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="font-mono text-xs text-house-muted tracking-widest uppercase mb-4">
          Behavioral Genome
        </h2>
        <div className="space-y-3 bg-house-surface border border-house-border rounded-lg p-4">
          {Object.entries(c.behavioral_traits).map(([key, val]) => (
            <TraitBar key={key} traitKey={key} value={val} />
          ))}
        </div>
      </section>

      {/* ── Lore ───────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="font-mono text-xs text-house-muted tracking-widest uppercase mb-4">
          Background
        </h2>
        <div className="space-y-3">
          {c.lore_text.split("\n\n").map((para, i) => (
            <p key={i} className="text-house-muted text-sm leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* ── Lineage ────────────────────────────────────────── */}
      {c.parents.length > 0 && (
        <section className="mb-8">
          <h2 className="font-mono text-xs text-house-muted tracking-widest uppercase mb-4">
            Lineage
          </h2>
          <Link href="/tree" className="text-house-amber hover:underline text-sm">
            View full family tree →
          </Link>
        </section>
      )}

      {/* ── Chat CTA ───────────────────────────────────────── */}
      <div className="mt-8">
        {isMom ? (
          <Link
            href={`/chat/${c.token_address}`}
            className="block w-full text-center px-6 py-3 bg-house-amber text-black font-semibold rounded hover:bg-house-amber/90 transition-colors"
          >
            Chat with {c.name}
          </Link>
        ) : (
          <div className="block w-full text-center px-6 py-3 bg-house-surface border border-house-border rounded text-house-muted text-sm cursor-not-allowed">
            Chat available in Season 2
          </div>
        )}
      </div>
    </div>
  );
}
