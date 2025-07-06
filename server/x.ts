// X（旧Twitter）投稿用ユーティリティ
// Cloudflare Workersでfetchを使ってX API v1.1にOAuth1.0a署名付きで投稿
// 4つの認証情報（API Key, API Secret, Access Token, Access Token Secret）を利用

import { enc, HmacSHA1 } from "crypto-js";
import Oauth from "oauth-1.0a";

export async function postToX({
  apiKey,
  apiSecret,
  accessToken,
  accessTokenSecret,
  text,
  images,
}: {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  text: string;
  images?: Array<Blob>;
}): Promise<{ success: boolean; message: string }> {
  console.log("X投稿開始:", { text, images: images?.length || 0 });

  // テキストも画像も空なら投稿しない
  if (!text && (!images || images.length === 0)) {
    return {
      success: false,
      message: "テキストまたは画像のいずれかを入力してください",
    };
  }
  const oauth = new Oauth({
    consumer: {
      key: apiKey,
      secret: apiSecret,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return HmacSHA1(baseString, key).toString(enc.Base64);
    },
  });
  const oauthToken = {
    key: accessToken,
    secret: accessTokenSecret,
  };

  const mediaIds: string[] = [];
  if (images && images.length > 0) {
    for (const img of images.slice(0, 4)) {
      // media/upload
      const form = new FormData();
      form.append("media", img, "image.jpg");
      const uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
      const uploadHeaders = {
        ...oauth.toHeader(
          oauth.authorize({ url: uploadUrl, method: "POST" }, oauthToken),
        ),
      };
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: uploadHeaders,
        body: form,
      });
      const result = await res.json();
      if (res.ok && result.media_id_string) {
        mediaIds.push(result.media_id_string);
      } else {
        return {
          success: false,
          message: `X画像アップロード失敗: ${JSON.stringify(result)}`,
        };
      }
    }
  }

  // 投稿本体（v1.1: statuses/update）
  const statusUrl = "https://api.twitter.com/1.1/statuses/update.json";
  const statusHeaders = {
    ...oauth.toHeader(
      oauth.authorize({ url: statusUrl, method: "POST" }, oauthToken),
    ),
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  };
  const params = new URLSearchParams();
  if (text) params.append("status", text);
  if (mediaIds.length > 0) params.append("media_ids", mediaIds.join(","));
  const res = await fetch(statusUrl, {
    method: "POST",
    headers: statusHeaders,
    body: params,
  });
  const result = await res.json();
  console.log("X投稿レスポンス:", JSON.stringify(result));

  if (!res.ok) {
    console.error("X投稿エラー詳細:", JSON.stringify(result));
    return { success: false, message: `X投稿失敗: ${JSON.stringify(result)}` };
  }
  return { success: true, message: "X投稿成功" };
}
