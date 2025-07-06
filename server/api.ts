import manifest from "__STATIC_CONTENT_MANIFEST";
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import { cors } from "hono/cors";
import { postToBluesky } from "./bluesky";
import { CHARACTER_LIMITS, type Platform } from "./constants";
import { postToMastodon } from "./mastodon";
import { postToMisskey } from "./misskey";
import type { Env } from "./types";
import { postToX } from "./x";

const app = new Hono<{ Bindings: Env }>();
const api = new Hono<{ Bindings: Env }>();

// CORS有効化
api.use("*", cors());

// SNSプラットフォーム情報
api.get("/platforms", (c) => {
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

api.get("/character-limits", (c) => {
  return c.json(CHARACTER_LIMITS);
});

// SNS投稿API
api.post("/post", async (c) => {
  // multipart/form-data or application/json
  let data: Record<string, { selected?: boolean; content?: string }> | null =
    null;
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
    if (images.length > 4) {
      return c.json({ success: false, error: "画像は最大4枚までです" }, 400);
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

  // 各SNSごとに型安全に投稿関数を呼び出す
  for (const config of platformConfigs) {
    if (config.enabled) {
      if (config.creds.some((cred) => !cred)) {
        results[config.id] = {
          success: false,
          message: `${config.id}認証情報未設定`,
        };
      } else if (config.id === "bluesky") {
        const { identifier, password, text, images } = config.args as {
          identifier: string;
          password: string;
          text: string;
          images: Blob[];
        };
        if (identifier && password && typeof text === "string") {
          results[config.id] = await postToBluesky({
            identifier,
            password,
            text,
            images,
          });
        } else {
          results[config.id] = {
            success: false,
            message: "blueskyパラメータ不正",
          };
        }
      } else if (config.id === "misskey") {
        const { instance, token, text, images } = config.args as {
          instance: string;
          token: string;
          text: string;
          images: Blob[];
        };
        if (instance && token && typeof text === "string") {
          results[config.id] = await postToMisskey({
            instance,
            token,
            text,
            images,
          });
        } else {
          results[config.id] = {
            success: false,
            message: "misskeyパラメータ不正",
          };
        }
      } else if (config.id === "mastodon") {
        const { instance, token, text, images } = config.args as {
          instance: string;
          token: string;
          text: string;
          images: Blob[];
        };
        if (instance && token && typeof text === "string") {
          results[config.id] = await postToMastodon({
            instance,
            token,
            text,
            images,
          });
        } else {
          results[config.id] = {
            success: false,
            message: "mastodonパラメータ不正",
          };
        }
      } else if (config.id === "x") {
        const { apiKey, apiSecret, accessToken, accessTokenSecret, text } =
          config.args as {
            apiKey: string;
            apiSecret: string;
            accessToken: string;
            accessTokenSecret: string;
            text: string;
            images?: Blob[];
          };
        if (
          apiKey &&
          apiSecret &&
          accessToken &&
          accessTokenSecret &&
          typeof text === "string"
        ) {
          results[config.id] = await postToX({
            apiKey,
            apiSecret,
            accessToken,
            accessTokenSecret,
            text,
            images: images,
          });
        } else {
          results[config.id] = { success: false, message: "xパラメータ不正" };
        }
      }
    }
  }

  const all_success = Object.values(results).every((r) => r.success);
  const status = all_success ? 200 : 400;
  return c.json({ success: all_success, results }, status);
});

app.route("/api", api);

// Serve static files
app.use("/*", serveStatic({ root: "./", manifest }));
app.get("/", serveStatic({ path: "./index.html", manifest }));

export default app;
