/**
 * Static contestant data loaded from content/contestants.json.
 * This is imported at build time — no API call needed for profiles.
 * During wiring phase (Hours 13-16), swap to a fetch from /api/contestant/[address].
 */
import type { Contestant } from "./types";
import rawData from "../../content/contestants.json";

const contestants: Contestant[] = (rawData as Contestant[]).filter(
  (c) => c.token_address !== "DEPLOY_PENDING"
);

export default contestants;

export function getContestant(address: string): Contestant | undefined {
  return contestants.find((c) => c.token_address === address);
}

export function getContestantByTicker(ticker: string): Contestant | undefined {
  return contestants.find((c) => c.ticker === ticker);
}
