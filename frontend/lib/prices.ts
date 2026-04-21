import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://the-house-backend-production.up.railway.app";

export interface PriceData {
  price: number | null;
  change_24h: number | null;
  mood: string;
}

export type PricesMap = Record<string, PriceData>;

let _cache: PricesMap | null = null;
let _cacheTs = 0;
const CACHE_TTL = 60_000;

export async function fetchPrices(): Promise<PricesMap> {
  if (_cache && Date.now() - _cacheTs < CACHE_TTL) return _cache;
  const res = await fetch(`${API_BASE}/api/prices`);
  if (!res.ok) throw new Error("prices fetch failed");
  _cache = await res.json();
  _cacheTs = Date.now();
  return _cache!;
}

export function usePrices(): PricesMap | null {
  const [prices, setPrices] = useState<PricesMap | null>(null);

  useEffect(() => {
    fetchPrices().then(setPrices).catch(() => {});
    const id = setInterval(() => {
      _cache = null;
      fetchPrices().then(setPrices).catch(() => {});
    }, CACHE_TTL);
    return () => clearInterval(id);
  }, []);

  return prices;
}

export function formatPrice(price: number | null): string {
  if (price == null) return "—";
  if (price < 0.000001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

export function formatChange(change: number | null): string {
  if (change == null) return "";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}
