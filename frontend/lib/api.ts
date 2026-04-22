const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://the-house-backend-production.up.railway.app";

// Lowercase addresses with live chat unlocked
const CHAT_ENABLED_ADDRESSES = new Set([
  "0x2a9796be8c555558d10079e53fb35a2e5da6a317", // MOM
  "0x74a69d5999da4f187c3d318c1850081e76cfa849", // DAD
  "0xb203132692e11536863fad7e650c17e2f0a317e9", // GNSP
  "0x2859e4544c4bb03966803b044a93563bd2d0dd4d", // SHIB
  "0xba2ae424d960c26247dd6c32edc70b295c744c43", // DOGE
  "0x6b94fb6591141ff8ba29654644f6b35f94ae06d5", // PHNIX
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
