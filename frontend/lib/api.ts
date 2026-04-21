const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// MOM's mock address — the only contestant with real chat in MVP
const MOM_ADDRESS = "0x2A9796Be8C555558d10079E53FB35A2e5dA6a317";

export function isChatEnabled(address: string): boolean {
  return address.toLowerCase() === MOM_ADDRESS.toLowerCase();
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
