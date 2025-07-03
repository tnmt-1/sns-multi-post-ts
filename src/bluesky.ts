// Bluesky投稿用ユーティリティ
// Cloudflare Workersでfetchを使ってBluesky APIに投稿
import { AtpAgent } from "@atproto/api";

export async function postToBluesky({
  identifier,
  password,
  text,
  images,
}: {
  identifier: string;
  password: string;
  text: string;
  images?: Array<Blob>;
}): Promise<{ success: boolean; message: string }> {
  try {
    const agent = new AtpAgent({ service: "https://bsky.social" });
    await agent.login({ identifier, password });

    // 画像は未対応
    const postRes = await agent.post({
      $type: "app.bsky.feed.post",
      text,
      createdAt: new Date().toISOString(),
    });
    console.log("Bluesky投稿成功:", JSON.stringify(postRes));

    return { success: true, message: "Bluesky投稿成功" };
  } catch (e: any) {
    console.error("Bluesky投稿エラー:", e);
    return { success: false, message: "Bluesky投稿失敗: " + (e?.message || e) };
  }
}
