// Bluesky投稿用ユーティリティ
// Cloudflare Workersでfetchを使ってBluesky APIに投稿
import { AtpAgent, type BlobRef, RichText } from "@atproto/api";

type Embed =
  | {
      $type: "app.bsky.embed.images";
      images: { image: BlobRef; alt: string }[];
    }
  | {
      $type: "app.bsky.embed.external";
      external: {
        uri: string;
        title: string;
        description: string;
        thumb?: BlobRef;
      };
    }
  | undefined;

// OGP情報を取得するヘルパー関数
async function fetchOgp(url: string) {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "bot" } });
    if (!response.ok) {
      throw new Error(`Failed to fetch OGP: ${response.statusText}`);
    }
    const html = await response.text();
    const titleMatch = html.match(
      /<meta\s+property="og:title"\s+content="([^"]*)"/,
    );
    const descriptionMatch = html.match(
      /<meta\s+property="og:description"\s+content="([^"]*)"/,
    );
    const imageMatch = html.match(
      /<meta\s+property="og:image"\s+content="([^"]*)"/,
    );
    return {
      title: titleMatch ? titleMatch[1] : new URL(url).hostname,
      description: descriptionMatch ? descriptionMatch[1] : "",
      imageUrl: imageMatch ? imageMatch[1] : undefined,
    };
  } catch (e) {
    console.error("OGPの取得に失敗:", e);
    return {
      title: new URL(url).hostname,
      description: "",
      imageUrl: undefined,
    };
  }
}

// リンクカードのembedオブジェクトを作成する
async function createLinkCardEmbed(
  url: string,
  agent: AtpAgent,
): Promise<Embed> {
  try {
    const ogp = await fetchOgp(url);
    let thumb: BlobRef | undefined;

    if (ogp.imageUrl) {
      try {
        const imageResponse = await fetch(ogp.imageUrl);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          const res = await agent.uploadBlob(imageBlob);
          if (res.success) {
            thumb = res.data.blob;
          }
        }
      } catch (e) {
        console.error("OGP画像のアップロードに失敗:", e);
      }
    }

    return {
      $type: "app.bsky.embed.external",
      external: {
        uri: url,
        title: ogp.title,
        description: ogp.description,
        thumb,
      },
    };
  } catch (e) {
    console.error("リンクカード作成中にエラー:", e);
    return undefined;
  }
}

// 画像のembedオブジェクトを作成する
async function createImageEmbed(
  images: Blob[],
  agent: AtpAgent,
): Promise<Embed> {
  const uploaded: { image: BlobRef; alt: string }[] = [];
  for (const img of images.slice(0, 4)) {
    try {
      const res = await agent.uploadBlob(img);
      if (res.success) {
        uploaded.push({ image: res.data.blob, alt: "image" });
      }
    } catch (e) {
      console.error("画像アップロード中にエラー:", e);
    }
  }
  if (uploaded.length > 0) {
    return { $type: "app.bsky.embed.images", images: uploaded };
  }
  return undefined;
}

export async function postToBluesky({
  identifier,
  password,
  text,
  images,
}: {
  identifier: string;
  password: string;
  text: string;
  images?: Blob[];
}): Promise<{ success: boolean; message: string }> {
  console.log("Bluesky投稿開始:", { text, hasImage: !!images?.length });

  try {
    const agent = new AtpAgent({ service: "https://bsky.social" });
    await agent.login({ identifier, password });

    const richText = new RichText({ text });
    await richText.detectFacets(agent);

    let embed: Embed;
    if (images && images.length > 0) {
      embed = await createImageEmbed(images, agent);
    } else {
      const urlMatch = text.match(/https?:\/\/\S+/);
      if (urlMatch) {
        embed = await createLinkCardEmbed(urlMatch[0], agent);
      }
    }

    if (!richText.text && !embed) {
      return {
        success: false,
        message: "テキストまたは画像のいずれかを入力してください",
      };
    }

    await agent.post({
      $type: "app.bsky.feed.post",
      text: richText.text,
      facets: richText.facets,
      createdAt: new Date().toISOString(),
      embed,
    });

    console.log("Bluesky投稿成功");
    return { success: true, message: "Bluesky投稿成功" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Bluesky投稿エラー:", msg);
    return { success: false, message: `Bluesky投稿失敗: ${msg}` };
  }
}
