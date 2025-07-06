# SNS Multi Post TypeScript (Cloudflare Workers + Hono)

このリポジトリは、SNSへのマルチポストを行うWebアプリケーションのソースコードです。
フロントエンドとバックエンドを含むモノレポ構成になっています。

- `server/`: バックエンドAPI (Cloudflare Workers + Hono)
- `src/`: フロントエンド (React + Vite)

## 特徴

- **モノレポ構成**: フロントエンドとバックエンドを単一リポジトリで管理
- TypeScript + Hono (超高速Webフレームワーク)
- Docker不要
- pnpmで依存管理
- miseでNode.jsバージョン管理
- wranglerでCloudflare Workersへコマンドデプロイ
- CORS対応済み

## セットアップ (バックエンド)

### 1. Node.jsのインストール (mise推奨)

```bash
mise use node@lts
```

### 2. 依存パッケージのインストール

```bash
pnpm install
```

### 3. ローカル開発サーバ起動

```bash
pnpm dev
```

### 4. Cloudflare Workersへデプロイ

```bash
pnpm deploy
```

## APIエンドポイント

- `GET /api/platforms` ... 利用可能なSNS一覧・文字数制限
- `GET /api/character_limits` ... 文字数制限のみ
- `POST /api/post` ... SNS投稿 (現状ダミー)

## 注意

- 画像アップロードやSNS API連携はCloudflare Workersの制約に注意して実装してください
- 本番運用時はAPIキー等の管理に十分注意してください

---
