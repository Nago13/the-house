const LABELS: Record<string, string> = {
  verbosity:           "Verbosity",
  aggression:          "Aggression",
  humor_axis:          "Humor",
  sociability:         "Sociability",
  volatility_response: "Volatility",
};

const COLORS: Record<string, string> = {
  verbosity:           "bg-house-amber",
  aggression:          "bg-red-500",
  humor_axis:          "bg-yellow-400",
  sociability:         "bg-house-chain",
  volatility_response: "bg-purple-400",
};

interface Props {
  traitKey: string;
  value: number;      // 0–1
  parentValue?: number;
}

export default function TraitBar({ traitKey, value, parentValue }: Props) {
  const pct    = Math.round(value * 100);
  const color  = COLORS[traitKey] ?? "bg-house-amber";
  const label  = LABELS[traitKey] ?? traitKey;

  return (
    <div>
      <div className="flex justify-between mb-1 text-xs">
        <span className="text-house-muted font-mono">{label}</span>
        <span className="text-house-text font-mono">{pct}%</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-house-border overflow-hidden">
        {/* parent ghost bar */}
        {parentValue !== undefined && (
          <div
            className="absolute inset-y-0 left-0 rounded-full opacity-25 bg-white"
            style={{ width: `${parentValue * 100}%` }}
          />
        )}
        {/* actual bar */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
