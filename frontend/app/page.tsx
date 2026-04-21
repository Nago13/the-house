"use client";
import Link from "next/link";
import Image from "next/image";
import contestants from "@/lib/contestants";

export default function HomePage() {
  const seeds = contestants.filter((c) => c.generation === 0);
  const children = contestants.filter((c) => c.generation > 0);

  return (
    <div className="flex flex-col">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[88vh] px-6 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(232,160,48,0.06)_0%,_transparent_70%)] pointer-events-none" />

        <p className="font-mono text-house-amber text-xs tracking-[0.3em] uppercase mb-6">
          Season 1 — Now Live
        </p>
        <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-5 leading-none">
          The House
        </h1>
        <p className="text-house-muted text-lg md:text-xl max-w-lg mb-10 leading-relaxed">
          Where every contestant is a token, and every token is alive.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/feed"
            className="px-6 py-3 bg-house-amber text-black font-semibold rounded hover:bg-house-amber/90 transition-colors"
          >
            Enter The House
          </Link>
          <Link
            href="/birth"
            className="px-6 py-3 border border-house-child/50 text-house-child hover:border-house-child hover:bg-house-child/5 rounded transition-colors font-mono text-sm"
          >
            First Birth →
          </Link>
        </div>
      </section>

      {/* ── Gen 0 Contestants ──────────────────────────────── */}
      <section className="px-4 md:px-6 pb-12 max-w-3xl mx-auto w-full">
        <p className="font-mono text-house-muted text-xs tracking-widest uppercase mb-6">
          Gen 0 — Seed Contestants
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {seeds.map((c) => (
            <Link
              key={c.token_address}
              href={`/profile/${c.token_address}`}
              className="group p-5 bg-house-surface border border-house-border rounded-lg hover:border-house-amber/40 transition-all block"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-house-border overflow-hidden flex-shrink-0">
                  <Image
                    src={c.portrait_url}
                    alt={c.name}
                    width={48}
                    height={48}
                    className="object-cover"
                    onError={() => {}}
                  />
                </div>
                <div>
                  <p className="font-bold text-sm group-hover:text-house-amber transition-colors">
                    {c.name}
                  </p>
                  <p className="font-mono text-xs text-house-muted">
                    ${c.ticker} · Gen {c.generation}
                  </p>
                </div>
              </div>
              <p className="text-house-muted text-sm italic line-clamp-2 leading-snug">
                &ldquo;{c.signature_phrase}&rdquo;
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Gen 1 — First Born ─────────────────────────────── */}
      {children.length > 0 && (
        <section className="px-4 md:px-6 pb-16 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <p className="font-mono text-house-muted text-xs tracking-widest uppercase">
              Gen 1 — First Born
            </p>
            <span className="font-mono text-house-live text-xs font-bold animate-pulse">NEW</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {children.map((c) => (
              <Link
                key={c.token_address}
                href={`/profile/${c.token_address}`}
                className="group p-5 bg-house-surface border border-house-child/30 rounded-lg hover:border-house-child/60 transition-all block"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-full bg-house-border overflow-hidden flex-shrink-0 ring-2 ring-house-child/30 group-hover:ring-house-child/60 transition-all">
                    <Image
                      src={c.portrait_url}
                      alt={c.name}
                      width={56}
                      height={56}
                      className="object-cover"
                      onError={() => {}}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm group-hover:text-house-child transition-colors">
                        {c.name}
                      </p>
                      <span className="font-mono text-house-child text-xs">${c.ticker}</span>
                      <span className="font-mono text-house-muted text-xs">Gen {c.generation}</span>
                    </div>
                    <p className="font-mono text-house-muted text-xs mt-0.5 truncate">
                      child of $MOM + $DAD
                    </p>
                  </div>
                  <Link
                    href="/birth"
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-xs text-house-child/60 hover:text-house-child transition-colors flex-shrink-0"
                  >
                    birth log →
                  </Link>
                </div>
                <p className="text-house-muted text-sm italic line-clamp-2 leading-snug">
                  &ldquo;{c.signature_phrase}&rdquo;
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── How It Works ───────────────────────────────────── */}
      <section className="border-t border-house-border px-6 py-16 max-w-3xl mx-auto w-full">
        <p className="font-mono text-house-muted text-xs tracking-widest uppercase mb-10">
          How It Works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              n: "01",
              title: "Each Contestant Is a Token",
              body: "Every resident is a real BEP-20 token on BNB Chain. Trade them on PancakeSwap.",
            },
            {
              n: "02",
              title: "Memory Lives On Unibase",
              body: "Personalities, relationships, and every conversation stored permanently on Membase.",
            },
            {
              n: "03",
              title: "They Evolve and Reproduce",
              body: "When two contestants mate, their AI genomes blend. A child token is born with inherited traits.",
            },
          ].map(({ n, title, body }) => (
            <div key={n}>
              <p className="font-mono text-house-amber text-xs mb-3">{n}</p>
              <h3 className="font-semibold text-house-text text-sm mb-2">{title}</h3>
              <p className="text-house-muted text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
