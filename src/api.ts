import { Hono } from "hono";
import { cors } from "hono/cors";
import { postToBluesky } from "./bluesky";
import { postToMastodon } from "./mastodon";
import { postToMisskey } from "./misskey";
import { postToX } from "./x";

// Cloudflare Workersの環境変数型定義
type Env = {
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

const app = new Hono<{ Bindings: Env }>();

// CORS有効化
app.use("*", cors());

// SNSプラットフォーム情報（ダミー）
const CHARACTER_LIMITS = {
  bluesky: 300,
  x: 280,
  misskey: 3000,
  mastodon: 500,
} as const;

type Platform = keyof typeof CHARACTER_LIMITS;

app.get("/api/platforms", (c) => {
  const env = c.env as Env;
  const platforms = Object.fromEntries(
    (Object.keys(CHARACTER_LIMITS) as Platform[]).map((platform) => {
      let enabled = false;
      switch (platform) {
        case "bluesky":
          enabled = !!(env.BLUESKY_USERNAME && env.BLUESKY_PASSWORD);
          break;
        case "x":
          enabled = !!env.X_API_KEY;
          break;
        case "misskey":
          enabled = !!env.MISSKEY_API_TOKEN;
          break;
        case "mastodon":
          enabled = !!env.MASTODON_ACCESS_TOKEN;
          break;
      }
      return [
        platform,
        {
          enabled: enabled,
          limit: CHARACTER_LIMITS[platform],
        },
      ];
    }),
  );
  return c.json(platforms);
});

app.get("/api/character_limits", (c) => {
  return c.json(CHARACTER_LIMITS);
});

// SNS投稿API
app.post("/api/post", async (c) => {
  // multipart/form-data or application/json
  let data: any;
  const images: Blob[] = [];
  if (c.req.header("content-type")?.startsWith("multipart/form-data")) {
    const form = await c.req.formData();
    const postData = form.get("postData");
    data = postData ? JSON.parse(postData as string) : null;
    // 画像ファイルは form.getAll('image0'), form.getAll('image1') ... で取得可能
    let i = 0;
    while (true) {
      const img = form.get(`image${i}`);
      if (!img) break;
      if (img instanceof Blob) images.push(img);
      i++;
    }
  } else {
    data = await c.req.json();
  }
  if (!data) {
    return c.json({ success: false, error: "データが送信されていません" }, 400);
  }

  const env = c.env as Env;
  const results: Record<Platform, { success: boolean; message: string }> =
    {} as any;

  // Bluesky
  if (data.bluesky?.selected) {
    if (!env.BLUESKY_USERNAME || !env.BLUESKY_PASSWORD) {
      results.bluesky = { success: false, message: "Bluesky認証情報未設定" };
    } else {
      results.bluesky = await postToBluesky({
        identifier: env.BLUESKY_USERNAME,
        password: env.BLUESKY_PASSWORD,
        text: data.bluesky.content,
        images,
      });
    }
  }

  // Misskey
  if (data.misskey?.selected) {
    if (!env.MISSKEY_API_TOKEN || !env.MISSKEY_INSTANCE) {
      results.misskey = { success: false, message: "Misskey認証情報未設定" };
    } else {
      results.misskey = await postToMisskey({
        instance: env.MISSKEY_INSTANCE,
        token: env.MISSKEY_API_TOKEN,
        text: data.misskey.content,
        images,
      });
    }
  }

  // Mastodon
  if (data.mastodon?.selected) {
    if (!env.MASTODON_ACCESS_TOKEN || !env.MASTODON_INSTANCE) {
      results.mastodon = { success: false, message: "Mastodon認証情報未設定" };
    } else {
      results.mastodon = await postToMastodon({
        instance: env.MASTODON_INSTANCE,
        token: env.MASTODON_ACCESS_TOKEN,
        text: data.mastodon.content,
        images,
      });
    }
  }

  // X（旧Twitter）
  if (data.x?.selected) {
    if (
      !env.X_API_KEY ||
      !env.X_API_SECRET ||
      !env.X_ACCESS_TOKEN ||
      !env.X_ACCESS_TOKEN_SECRET
    ) {
      results.x = { success: false, message: "X認証情報未設定" };
    } else {
      results.x = await postToX({
        apiKey: env.X_API_KEY,
        apiSecret: env.X_API_SECRET,
        accessToken: env.X_ACCESS_TOKEN,
        accessTokenSecret: env.X_ACCESS_TOKEN_SECRET,
        text: data.x.content,
      });
    }
  }

  const all_success = Object.values(results).every((r) => r.success);
  return c.json({ success: all_success, results });
});

export default app;
