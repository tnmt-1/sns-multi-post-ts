// Cloudflare Workersの環境変数型定義
export type Env = {
  // Bluesky
  BLUESKY_USERNAME?: string;
  BLUESKY_PASSWORD?: string;
  // X/Twitter
  X_API_KEY?: string;
  X_API_SECRET?: string;
  X_ACCESS_TOKEN?: string;
  X_ACCESS_TOKEN_SECRET?: string;
  // Misskey
  MISSKEY_API_TOKEN?: string;
  MISSKEY_INSTANCE?: string;
  // Mastodon
  MASTODON_ACCESS_TOKEN?: string;
  MASTODON_INSTANCE?: string;
};
