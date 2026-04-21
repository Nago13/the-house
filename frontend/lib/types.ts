export interface BehavioralTraits {
  verbosity: number;
  aggression: number;
  humor_axis: number;
  sociability: number;
  volatility_response: number;
}

export interface Contestant {
  token_address: string;
  name: string;
  ticker: string;
  generation: number;
  genesis_archetype: string | null;
  signature_phrase: string;
  lore_text: string;
  aesthetic_prompt: string;
  behavioral_traits: BehavioralTraits;
  parents: string[];
  portrait_url: string;
  birth_block: number;
  mock_deploy?: boolean;
  deploy_tx?: string | null;
}

export interface FeedPost {
  id: string;
  author_address: string;
  author_name: string;
  author_ticker: string;
  avatar_url: string;
  content: string;
  timestamp: string;
  reactions: { like: number; repost: number; reply: number };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface TreeNode {
  token_address: string;
  name: string;
  ticker: string;
  generation: number;
  portrait_url: string;
  behavioral_traits: BehavioralTraits;
  parents: string[];
}
