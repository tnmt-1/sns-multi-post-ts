// SNSごとの文字数・画像数制限などの定数

export const CHARACTER_LIMITS: Record<string, number> = {
  bluesky: 300,
  x: 280,
  misskey: 3000,
  mastodon: 500,
};

export const IMAGE_LIMITS: Record<string, any> = {
  bluesky: {
    max_size: 976 * 1024, // 976.56KB
    min_size: 100, // px
    max_attempts: 15,
    max_images: 4,
  },
  mastodon: {
    max_images: 4,
  },
  misskey: {
    max_images: 4,
  },
  x: {
    max_images: 4,
  },
  // 他SNS用も必要に応じて追加可能
};
