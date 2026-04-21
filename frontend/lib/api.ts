const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://the-house-backend-production.up.railway.app";

// Lowercase addresses with live chat unlocked
const CHAT_ENABLED_ADDRESSES = new Set([
  "0x2a9796be8c555558d10079e53fb35a2e5da6a317", // MOM
  "0xd000000000000000000000000000000000000001", // SHIB
  "0xd000000000000000000000000000000000000002", // DOGE
  "0xd000000000000000000000000000000000000007", // PHNIX
]);

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
