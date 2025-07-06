# プロジェクト概要

このプロジェクトは、ユーザーが SNS へポストするためのシンプルな Web アプリケーションです。

# 主要な技術スタック

- フロントエンド: React, TypeScript, Vite
- バックエンド: Node.js, Hono
- スタイリング: Tailwind CSS
- リンター, フォーマッター: Biome
- インフラ: Cloudflare Workers
- ツール: pnpm, mise

# コーディング規約

- [Google JavaScript Style" Guide](https://google.github.io/styleguide/jsguide.html)に準拠します。
- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) の規約に従います。

# ファイル構成

- `src/`: フロントエンドのソースコード
  - `components/`: 再利用可能な React コンポーネント
  - `pages/`: 各ページのコンポーネント
- `server/`: バックエンドのソースコード
- `tests/`: テストコード

# コマンド

- `pnpm run dev`: 開発サーバーを起動します。
- `pnpm run build`: プロダクション用にビルドします。
- `pnpm test`: テストを実行します。
- `pnpm deploy`: Cloudeflare にデプロイします。

# お願い

- かならず Biome を適用してフォーマットしてください。 Biome の警告、エラーは対処してください。
