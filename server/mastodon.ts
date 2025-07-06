// Mastodon投稿用ユーティリティ
// Cloudflare Workersでfetchを使ってMastodon APIに投稿

export async function postToMastodon({
  instance,
  token,
  text,
  images,
}: {
  instance: string; // 例: "mstdn.jp"
  token: string;
  text: string;
  images?: Array<Blob>;
}): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Mastodon投稿開始:", { text, images: images?.length || 0 });

    const mediaIds: string[] = [];
    if (images && images.length > 0) {
      for (const img of images.slice(0, 4)) {
        const form = new FormData();
        form.append("file", img, "image.jpg");
        const res = await fetch(`https://${instance}/api/v2/media`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });
        const result = await res.json();
        console.log("Mastodon画像アップロードレスポンス:", result);
        const mediaId = result.id || result.media_id || result.id_str;
        if (res.ok && mediaId) {
          mediaIds.push(mediaId);
        } else {
          return {
            success: false,
            message: `Mastodon画像アップロード失敗: ${JSON.stringify(result)}`,
          };
        }
      }
    }
    // テキストも画像も空なら投稿しない
    if (!text && mediaIds.length === 0) {
      return {
        success: false,
        message: "テキストまたは画像のいずれかを入力してください-----",
      };
    }
    const body: Record<string, unknown> = {};
    if (text) body.status = text;
    if (mediaIds.length > 0) body.media_ids = mediaIds;
    const statusRes = await fetch(`https://${instance}/api/v1/statuses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const statusResult = await statusRes.json();
    console.log("Mastodon投稿レスポンス:", JSON.stringify(statusResult));

    if (!statusRes.ok) {
      return {
        success: false,
        message: "Mastodon投稿失敗: " + JSON.stringify(statusResult),
      };
    }
    return { success: true, message: "Mastodon投稿成功" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, message: "Mastodon投稿失敗: " + msg };
  }
}
