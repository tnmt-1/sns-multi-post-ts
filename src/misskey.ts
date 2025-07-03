// Misskey投稿用ユーティリティ
// Cloudflare Workersでfetchを使ってMisskey APIに投稿

export async function postToMisskey({
  instance,
  token,
  text,
  images,
}: {
  instance: string; // 例: "misskey.io"
  token: string;
  text: string;
  images?: Array<Blob>;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`https://${instance}/api/notes/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        i: token,
        text,
        visibility: "home",
        // CW, localOnly, etc. 必要に応じて追加
      }),
    });
    console.log("Misskey投稿レスポンス:", JSON.stringify(res));

    if (!res.ok) {
      return { success: false, message: "Misskey投稿失敗" };
    }
    return { success: true, message: "Misskey投稿成功" };
  } catch (e: any) {
    return { success: false, message: "Misskey投稿失敗: " + (e?.message || e) };
  }
}
