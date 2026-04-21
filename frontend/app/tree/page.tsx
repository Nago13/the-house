"use client";
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import Image from "next/image";
import Link from "next/link";
import contestants from "@/lib/contestants";

// ── Ticker colours ─────────────────────────────────────────────────────────

const TICKER_COLOR: Record<string, string> = {
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
};

function tickerColor(ticker: string, generation: number): string {
  return TICKER_COLOR[ticker] ?? (generation === 0 ? "#6b7280" : "#a78bfa");
}

// ── Custom node ────────────────────────────────────────────────────────────

const GEN_SIZES: Record<number, number> = {
  0: 152,
  1: 120,
};
const DEFAULT_SIZE = 100;

function ContestantNode({ data }: NodeProps) {
  const color = tickerColor(data.ticker, data.generation);
  const size = GEN_SIZES[data.generation as number] ?? DEFAULT_SIZE;

  return (
    <div
      className="flex flex-col items-center hover:scale-[1.05] transition-transform"
      style={{ width: size }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "transparent", border: "none", top: 0 }} />

      <Link href={`/profile/${data.token_address}`} className="flex flex-col items-center gap-2">
        {/* Coin circle */}
        <div
          className="relative rounded-full overflow-hidden flex-shrink-0"
          style={{
            width: size,
            height: size,
            border: `3px solid ${color}`,
            boxShadow: `0 0 14px ${color}66, 0 0 32px ${color}33`,
          }}
        >
          <Image
            src={data.portrait_url}
            alt={data.name}
            fill
            className="object-cover"
            onError={() => {}}
          />
          {data.generation > 0 && (
            <span
              className="absolute bottom-1 right-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${color}dd`, color: "#000" }}
            >
              GEN {data.generation}
            </span>
          )}
        </div>

        {/* Label */}
        <div className="text-center" style={{ maxWidth: size + 16 }}>
          <p className="font-bold text-sm text-house-text truncate leading-tight">{data.name}</p>
          <p className="font-mono text-xs font-semibold truncate" style={{ color }}>
            ${data.ticker}
          </p>
        </div>
      </Link>

      <Handle type="source" position={Position.Bottom} style={{ background: "transparent", border: "none", bottom: 0 }} />
    </div>
  );
}

const nodeTypes = { contestant: ContestantNode };

// ── Layout ─────────────────────────────────────────────────────────────────

const NODE_W  = 152;
const H_GAP   = 72;   // generous breathing room between nodes
const STEP    = NODE_W + H_GAP;
const V_GAP   = 260;  // vertical distance between generations

function buildGraph() {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const byGen: Record<number, typeof contestants> = {};
  for (const c of contestants) {
    (byGen[c.generation] ??= []).push(c);
  }

  const posMap: Record<string, { x: number; y: number }> = {};

  const GEN0_ORDER = ["SHIB","DOGE","PEPE","MOM","DAD","FLOKI","PENGU","FARTCOIN","PHNIX"];
  const gen0Raw = byGen[0] ?? [];
  const gen0 = [
    ...GEN0_ORDER.map((t) => gen0Raw.find((c) => c.ticker === t)).filter(Boolean),
    ...gen0Raw.filter((c) => !GEN0_ORDER.includes(c.ticker)),
  ] as typeof contestants;
  const totalW0 = gen0.length * NODE_W + (gen0.length - 1) * H_GAP;
  const startX0 = -(totalW0 / 2);
  gen0.forEach((c, i) => {
    const pos = { x: startX0 + i * STEP, y: 0 };
    posMap[c.token_address] = pos;
    nodes.push({ id: c.token_address, type: "contestant", position: pos, data: c });
  });

  const maxGen = Math.max(...contestants.map((c) => c.generation));
  for (let gen = 1; gen <= maxGen; gen++) {
    const genNodes = byGen[gen] ?? [];
    const y = gen * (NODE_W + V_GAP);

    genNodes.forEach((c, i) => {
      let x = startX0 + i * STEP;
      const resolvedParents = c.parents.map((addr) => posMap[addr]).filter(Boolean);
      if (resolvedParents.length > 0) {
        x = resolvedParents.reduce((sum, p) => sum + p.x, 0) / resolvedParents.length;
      }

      const pos = { x, y };
      posMap[c.token_address] = pos;
      nodes.push({ id: c.token_address, type: "contestant", position: pos, data: c });

      for (const parentAddr of c.parents) {
        if (!posMap[parentAddr]) continue;
        edges.push({
          id:           `${parentAddr}->${c.token_address}`,
          source:       parentAddr,
          target:       c.token_address,
          animated:     false,
          style:        { stroke: "#F59E0B", strokeWidth: 3, opacity: 1 },
          label:        "parent",
          labelStyle:   { fill: "#F59E0B", fontSize: 11, fontWeight: 700, opacity: 0.9 },
          labelBgStyle: { fill: "#0a0a0a", fillOpacity: 0.85 },
        });
      }
    });
  }

  // SHIB ⚔ DOGE rivalry edge
  const shibAddr = "0xd000000000000000000000000000000000000001";
  const dogeAddr = "0xd000000000000000000000000000000000000002";
  if (posMap[shibAddr] && posMap[dogeAddr]) {
    edges.push({
      id:           "shib-vs-doge",
      source:       shibAddr,
      target:       dogeAddr,
      type:         "straight",
      animated:     false,
      style:        { stroke: "#FF2222", strokeWidth: 3, strokeDasharray: "6,4", opacity: 1 },
      label:        "⚔ RIVALS",
      labelStyle:   { fill: "#FF2222", fontSize: 13, fontWeight: 900 },
      labelBgStyle: { fill: "#0a0a0a", fillOpacity: 0.95 },
    });
  }

  return { nodes, edges };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TreePage() {
  const { nodes, edges } = buildGraph();
  const maxGen = Math.max(...contestants.map((c) => c.generation));

  return (
    <div style={{ width: "100vw", height: "calc(100vh - 3.5rem)" }}>
      <div
        className="absolute top-16 left-4 z-10 rounded-2xl px-4 py-3"
        style={{
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(139,92,246,0.2)",
        }}
      >
        <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: "#8B5CF6" }}>
          Family Tree
        </p>
        <p className="font-mono text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {contestants.length} nodes · Gen 0–{maxGen}
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#111111" />
        <Controls
          style={{ background: "#0a0a0a", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "12px" }}
        />
      </ReactFlow>
    </div>
  );
}
