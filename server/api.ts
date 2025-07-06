import { Hono } from "hono";
import { cors } from "hono/cors";
import { postToBluesky } from "./bluesky";
import { postToMastodon } from "./mastodon";
import { postToMisskey } from "./misskey";
import type { Env } from "./types";
import { postToX } from "./x";

const app = new Hono<{ Bindings: Env }>();

// CORS有効化
app.use("*", cors());

// SNSプラットフォーム情報（ダミー）
import { CHARACTER_LIMITS, type Platform } from "./constants";

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

app.get("/api/character-limits", (c) => {
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
  const results: Record<string, { success: boolean; message: string }> = {};

  const platformConfigs = [
    {
      id: "bluesky",
      enabled: data.bluesky?.selected,
      creds: [env.BLUESKY_USERNAME, env.BLUESKY_PASSWORD],
      post: postToBluesky,
      args: {
        identifier: env.BLUESKY_USERNAME,
        password: env.BLUESKY_PASSWORD,
        text: data.bluesky?.content,
        images,
      },
    },
    {
      id: "misskey",
      enabled: data.misskey?.selected,
      creds: [env.MISSKEY_API_TOKEN, env.MISSKEY_INSTANCE],
      post: postToMisskey,
      args: {
        instance: env.MISSKEY_INSTANCE,
        token: env.MISSKEY_API_TOKEN,
        text: data.misskey?.content,
        images,
      },
    },
    {
      id: "mastodon",
      enabled: data.mastodon?.selected,
      creds: [env.MASTODON_ACCESS_TOKEN, env.MASTODON_INSTANCE],
      post: postToMastodon,
      args: {
        instance: env.MASTODON_INSTANCE,
        token: env.MASTODON_ACCESS_TOKEN,
        text: data.mastodon?.content,
        images,
      },
    },
    {
      id: "x",
      enabled: data.x?.selected,
      creds: [
        env.X_API_KEY,
        env.X_API_SECRET,
        env.X_ACCESS_TOKEN,
        env.X_ACCESS_TOKEN_SECRET,
      ],
      post: postToX,
      args: {
        apiKey: env.X_API_KEY,
        apiSecret: env.X_API_SECRET,
        accessToken: env.X_ACCESS_TOKEN,
        accessTokenSecret: env.X_ACCESS_TOKEN_SECRET,
        text: data.x?.content,
      },
    },
  ];

  for (const config of platformConfigs) {
    if (config.enabled) {
      if (config.creds.some((cred) => !cred)) {
        results[config.id] = {
          success: false,
          message: `${config.id}認証情報未設定`,
        };
      } else {
        results[config.id] = await config.post(config.args as any);
      }
    }
  }

  const all_success = Object.values(results).every((r) => r.success);
  return c.json({ success: all_success, results });
});

export default app;
