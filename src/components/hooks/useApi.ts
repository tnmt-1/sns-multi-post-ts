import { useEffect, useState } from "react";

const API_URL = {
  PLATFORMS: "/api/platforms",
  CHARACTER_LIMITS: "/api/character-limits",
  POST: "/api/post",
};

interface PlatformInfo {
  enabled: boolean;
  limit: number;
}

interface Platforms {
  [key: string]: PlatformInfo;
}

interface CharacterLimits {
  [key: string]: number;
}

export const fetchPlatformsAndLimits = async (): Promise<{
  platforms: Platforms;
  characterLimits: CharacterLimits;
}> => {
  const [platformsResponse, limitsResponse] = await Promise.all([
    fetch(API_URL.PLATFORMS),
    fetch(API_URL.CHARACTER_LIMITS),
  ]);

  if (!platformsResponse.ok) {
    throw new Error(
      `プラットフォーム情報の取得に失敗しました: ${platformsResponse.status}`,
    );
  }
  if (!limitsResponse.ok) {
    throw new Error(`文字数制限の取得に失敗しました: ${limitsResponse.status}`);
  }

  const platformsData: Platforms = await platformsResponse.json();
  const limitsData: CharacterLimits = await limitsResponse.json();

  return { platforms: platformsData, characterLimits: limitsData };
};

export const postContent = async (
  selectedPlatforms: string[],
  postDataPerPlatform: { [key: string]: string },
  selectedImageFiles: File[],
) => {
  const fetchPromises = selectedPlatforms.map(async (platform) => {
    // 画像が1枚以上ある場合のみmultipart/form-dataで送信
    const hasImage = selectedImageFiles.length > 0;
    if (hasImage) {
      const formData = new FormData();
      selectedImageFiles.forEach((file, idx) => {
        formData.append(`image${idx}`, file);
      });
      const singlePostData = {
        [platform]: {
          selected: true,
          content: postDataPerPlatform[platform],
        },
      };
      formData.append("postData", JSON.stringify(singlePostData));
      const response = await fetch(API_URL.POST, {
        method: "POST",
        body: formData,
      });
      let result: Record<string, unknown> = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }
      return { platform, success: response.ok, ...result };
    } else {
      const singlePostData = {
        [platform]: {
          selected: true,
          content: postDataPerPlatform[platform],
        },
      };
      const response = await fetch(API_URL.POST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(singlePostData),
      });
      let result: Record<string, unknown> = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }
      return { platform, success: response.ok, ...result };
    }
  });

  return Promise.all(fetchPromises);
};

export const useApi = () => {
  const [platforms, setPlatforms] = useState<Platforms>({});
  const [characterLimits, setCharacterLimits] = useState<CharacterLimits>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { platforms, characterLimits } = await fetchPlatformsAndLimits();
        setPlatforms(platforms);
        setCharacterLimits(characterLimits);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { platforms, characterLimits, loading, error };
};
