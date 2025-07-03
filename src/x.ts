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
}: {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  text: string;
}): Promise<{ success: boolean; message: string }> {
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

  const requestAuth = {
    url: "https://api.twitter.com/2/tweets",
    method: "POST",
  };
  const res = await fetch(requestAuth.url, {
    method: requestAuth.method,
    headers: {
      ...oauth.toHeader(oauth.authorize(requestAuth, oauthToken)),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  console.log("X投稿レスポンス:", JSON.stringify(res));

  if (!res.ok) {
    const err = await res.json();
    console.error("X投稿エラー詳細:", JSON.stringify(err));
    return { success: false, message: `X投稿失敗: ${JSON.stringify(err)}` };
  }
  return { success: true, message: "X投稿成功" };
}
