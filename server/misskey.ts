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
    console.log("Misskey投稿開始:", { text, images: images?.length || 0 });

    const fileIds: string[] = [];
    if (images && images.length > 0) {
      for (const img of images.slice(0, 4)) {
        const form = new FormData();
        form.append("i", token);
        form.append("file", img, "image.jpg");
        const res = await fetch(`https://${instance}/api/drive/files/create`, {
          method: "POST",
          body: form,
        });
        const result = await res.json();
        // 型アサーションで型エラーを回避
        const fileResult = result as { id?: string };
        if (res.ok && fileResult.id) {
          fileIds.push(fileResult.id);
        } else {
          return {
            success: false,
            message: `Misskey画像アップロード失敗: ${JSON.stringify(result)}`,
          };
        }
      }
    }
    // テキストも画像も空なら投稿しない
    if (!text && fileIds.length === 0) {
      return {
        success: false,
        message: "テキストまたは画像のいずれかを入力してください",
      };
    }
    const noteRes = await fetch(`https://${instance}/api/notes/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        i: token,
        text,
        visibility: "home",
        fileIds: fileIds.length > 0 ? fileIds : undefined,
        // CW, localOnly, etc. 必要に応じて追加
      }),
    });
    const noteResult = await noteRes.json();
    console.log("Misskey投稿レスポンス:", JSON.stringify(noteResult));

    if (!noteRes.ok) {
      return {
        success: false,
        message: "Misskey投稿失敗: " + JSON.stringify(noteResult),
      };
    }
    return { success: true, message: "Misskey投稿成功" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, message: "Misskey投稿失敗: " + msg };
  }
}
