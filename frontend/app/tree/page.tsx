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

// ── Custom node ────────────────────────────────────────────────────────────

function ContestantNode({ data }: NodeProps) {
  const tickerColor =
    data.ticker === "MOM"   ? "#c8894a" :
    data.ticker === "DAD"   ? "#2dd4bf" :
    "#a78bfa";

  return (
    <div className="w-40 bg-house-surface border border-house-border rounded-xl overflow-hidden hover:border-house-amber/50 transition-colors">
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
        </div>
        <div className="px-3 py-2">
          <p className="font-bold text-xs text-house-text">{data.name}</p>
          <p className="font-mono text-xs" style={{ color: tickerColor }}>
            ${data.ticker} · Gen {data.generation}
          </p>
        </div>
      </Link>

      <Handle type="source" position={Position.Bottom} style={{ background: "#262626", border: "none" }} />
    </div>
  );
}

const nodeTypes = { contestant: ContestantNode };

// ── Build graph ────────────────────────────────────────────────────────────

function buildGraph() {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Layout: gen 0 at top (MOM left, DAD right), gen 1 centered below
  const layout: Record<string, { x: number; y: number }> = {
    MOM:   { x: 80,  y: 40  },
    DAD:   { x: 340, y: 40  },
    CHILD: { x: 210, y: 280 },
  };

  for (const c of contestants) {
    const pos = layout[c.ticker] ?? { x: 200, y: 40 + c.generation * 240 };
    nodes.push({
      id:       c.token_address,
      type:     "contestant",
      position: pos,
      data:     c,
    });

    // Edges from each parent
    for (const parentAddr of c.parents) {
      const parent = contestants.find((p) => p.token_address === parentAddr);
      if (!parent) continue;
      edges.push({
        id:          `${parentAddr}->${c.token_address}`,
        source:      parentAddr,
        target:      c.token_address,
        animated:    false,
        style:       { stroke: "#333", strokeWidth: 1.5 },
        label:       "parent",
        labelStyle:  { fill: "#6b6560", fontSize: 9 },
        labelBgStyle:{ fill: "#0a0a0a" },
      });
    }
  }

  return { nodes, edges };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TreePage() {
  const { nodes, edges } = buildGraph();

  return (
    <div style={{ width: "100vw", height: "calc(100vh - 3.5rem)" }}>
      <div className="absolute top-16 left-4 z-10 bg-house-bg/80 backdrop-blur border border-house-border rounded-lg px-4 py-2">
        <p className="font-mono text-house-amber text-xs tracking-widest uppercase">
          Family Tree
        </p>
        <p className="font-mono text-house-muted text-xs mt-0.5">
          {contestants.length} node{contestants.length !== 1 ? "s" : ""} · Gen 0–{Math.max(...contestants.map((c) => c.generation))}
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
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
