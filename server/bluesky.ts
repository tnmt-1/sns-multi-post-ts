// Bluesky投稿用ユーティリティ
// Cloudflare Workersでfetchを使ってBluesky APIに投稿
import { AtpAgent, RichText } from "@atproto/api";

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
  console.log("Bluesky投稿開始:", { text, images: images?.length || 0 });

  try {
    const agent = new AtpAgent({ service: "https://bsky.social" });
    await agent.login({ identifier, password });

    const richText = new RichText({ text });
    await richText.detectFacets(agent); // For mentions and links

    let embed:
      | { $type: string; images: Array<{ image: unknown; alt: string }> }
      | undefined;
    const uploaded: Array<{ image: unknown; alt: string }> = [];
    if (images && images.length > 0) {
      for (const img of images.slice(0, 4)) {
        const res = await agent.uploadBlob(img);
        if (res?.data?.blob) {
          uploaded.push({
            image: res.data.blob,
            alt: "image",
          });
        }
      }
      if (uploaded.length > 0) {
        embed = { $type: "app.bsky.embed.images", images: uploaded };
      }
    }
    // テキストも画像も空なら投稿しない
    if (!text && uploaded.length === 0) {
      return {
        success: false,
        message: "テキストまたは画像のいずれかを入力してください",
      };
    }

    const postRes = await agent.post({
      $type: "app.bsky.feed.post",
      text: richText.text,
      facets: richText.facets,
      createdAt: new Date().toISOString(),
      embed,
    });
    console.log("Bluesky投稿成功:", JSON.stringify(postRes));

    return { success: true, message: "Bluesky投稿成功" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Bluesky投稿エラー:", msg);
    return { success: false, message: "Bluesky投稿失敗: " + msg };
  }
}
