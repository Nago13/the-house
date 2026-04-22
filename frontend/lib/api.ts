import contestants from "./contestants";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://the-house-backend-production.up.railway.app";

// All deployed contestants have chat enabled — derived from contestants.json
const CHAT_ENABLED_ADDRESSES = new Set(
  contestants
    .filter((c) => c.token_address && c.token_address !== "DEPLOY_PENDING")
    .map((c) => c.token_address.toLowerCase())
);

export function isChatEnabled(address: string): boolean {
  return CHAT_ENABLED_ADDRESSES.has(address.toLowerCase());
}

export async function sendChatMessage(
  address: string,
  message: string,
  userId: string
): Promise<{ response: string }> {
  const res = await fetch(`${API_BASE}/api/chat/${address}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, user_id: userId }),
  });
  if (!res.ok) throw new Error(`Chat API error: ${res.status}`);
  return res.json();
}

export function getUserId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("house_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("house_user_id", id);
  }
  return id;
}
