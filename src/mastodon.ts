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
  // 画像は未対応（Cloudflare Workersの制約上、画像アップロードは要検討）
  // トゥート投稿
  const res = await fetch(`https://${instance}/api/v1/statuses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: text,
      // visibility, sensitive, etc. 必要に応じて追加
    }),
  });
  console.log("Mastodon投稿レスポンス:", JSON.stringify(res));

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Mastodon投稿エラー:", JSON.stringify(errorText));
    return {
      success: false,
      message: "Mastodon投稿失敗: " + JSON.stringify(errorText),
    };
  }

  if (!res.ok) {
    return { success: false, message: "Mastodon投稿失敗" };
  }
  return { success: true, message: "Mastodon投稿成功" };
}
