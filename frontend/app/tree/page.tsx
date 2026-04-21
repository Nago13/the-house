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

function ContestantNode({ data }: NodeProps) {
  const color = tickerColor(data.ticker, data.generation);
  return (
    <div
      className="w-40 bg-house-surface rounded-xl overflow-hidden hover:scale-[1.03] transition-transform"
      style={{ border: `1px solid ${color}33` }}
    >
      <Handle type="target" position={Position.Top}    style={{ background: "#262626", border: "none" }} />

      <Link href={`/profile/${data.token_address}`}>
        <div className="relative w-full h-28 bg-house-border">
          <Image
            src={data.portrait_url}
            alt={data.name}
            fill
            className="object-cover"
            onError={() => {}}
          />
          {data.generation > 0 && (
            <span
              className="absolute top-1.5 right-1.5 text-[8px] font-mono tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
            >
              GEN {data.generation}
            </span>
          )}
        </div>
        <div className="px-3 py-2">
          <p className="font-bold text-xs text-house-text truncate">{data.name}</p>
          <p className="font-mono text-xs truncate" style={{ color }}>
            ${data.ticker} · Gen {data.generation}
          </p>
        </div>
      </Link>

      <Handle type="source" position={Position.Bottom} style={{ background: "#262626", border: "none" }} />
    </div>
  );
}

const nodeTypes = { contestant: ContestantNode };

// ── Layout ─────────────────────────────────────────────────────────────────

const NODE_W  = 160;
const H_GAP   = 44;   // gap between nodes in same row
const STEP    = NODE_W + H_GAP;
const V_GAP   = 220;  // vertical distance between generations

function buildGraph() {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Separate by generation
  const byGen: Record<number, typeof contestants> = {};
  for (const c of contestants) {
    (byGen[c.generation] ??= []).push(c);
  }

  // Track final x positions by address so children can center on parents
  const posMap: Record<string, { x: number; y: number }> = {};

  // Gen 0: enforce display order — founders (MOM/DAD) centred, rivals adjacent
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

  // Gen 1+: position each child centred over its parents, row by row
  const maxGen = Math.max(...contestants.map((c) => c.generation));
  for (let gen = 1; gen <= maxGen; gen++) {
    const genNodes = byGen[gen] ?? [];
    const y = gen * (NODE_W + V_GAP);

    genNodes.forEach((c, i) => {
      // Centre child under its parents' midpoint
      let x = startX0 + i * STEP; // fallback if no parents resolved
      const resolvedParents = c.parents
        .map((addr) => posMap[addr])
        .filter(Boolean);
      if (resolvedParents.length > 0) {
        x = resolvedParents.reduce((sum, p) => sum + p.x, 0) / resolvedParents.length;
      }

      const pos = { x, y };
      posMap[c.token_address] = pos;
      nodes.push({ id: c.token_address, type: "contestant", position: pos, data: c });

      // Edges from parents — only addresses that actually exist as nodes
      for (const parentAddr of c.parents) {
        if (!posMap[parentAddr]) continue;
        edges.push({
          id:           `${parentAddr}->${c.token_address}`,
          source:       parentAddr,
          target:       c.token_address,
          animated:     false,
          style:        { stroke: "#F59E0B", strokeWidth: 2.5, opacity: 0.8 },
          label:        "parent",
          labelStyle:   { fill: "#F59E0B", fontSize: 9, opacity: 0.7 },
          labelBgStyle: { fill: "#0a0a0a" },
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
      style:        { stroke: "#EF4444", strokeWidth: 2, strokeDasharray: "5,4", opacity: 0.85 },
      label:        "⚔ RIVALS",
      labelStyle:   { fill: "#EF4444", fontSize: 10, fontWeight: 700 },
      labelBgStyle: { fill: "#0a0a0a", fillOpacity: 0.9 },
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
      <div className="absolute top-16 left-4 z-10 bg-house-bg/80 backdrop-blur border border-house-border rounded-lg px-4 py-2">
        <p className="font-mono text-house-amber text-xs tracking-widest uppercase">
          Family Tree
        </p>
        <p className="font-mono text-house-muted text-xs mt-0.5">
          {contestants.length} nodes · Gen 0–{maxGen}
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1a1a1a" />
        <Controls
          style={{ background: "#141414", border: "1px solid #262626", borderRadius: "8px" }}
        />
      </ReactFlow>
    </div>
  );
}
