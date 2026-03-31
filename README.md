# ダイフゴウ (Daifugou)

大富豪カードゲームのリアルタイム対戦 Web アプリです。

## 技術スタック

- **フレームワーク**: Nuxt 3 (Vue 3 + TypeScript, compatibilityVersion: 4)
- **リアルタイム通信**: PartyKit（インメモリ）
- **スタイリング**: Tailwind CSS
- **デプロイ**: Vercel
- **i18n**: 日本語 / English (`@nuxtjs/i18n`)
- **テスト**: Vitest

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動（Nuxt）
npm run dev

# PartyKit ローカル開発サーバー起動
npm run dev:party
```

## 主なスクリプト

| コマンド | 説明 |
|---|---|
| `npm run dev` | Nuxt 開発サーバー起動 |
| `npm run dev:party` | PartyKit ローカルサーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run generate` | 静的サイト生成 |
| `npm run test` | Vitest テスト実行 |
| `npm run lint` | ESLint 実行 |
| `npm run typecheck` | TypeScript 型チェック |

## 環境変数

`.env.example` をコピーして `.env` を作成してください。

```bash
cp .env.example .env
```

| 変数名 | 説明 |
|---|---|
| `PARTYKIT_HOST` | PartyKit ホスト（本番: `<project>.partykit.dev`） |

## プロジェクト構成

```
/
├── app/                    # Nuxt アプリ (compatibilityVersion: 4)
│   ├── pages/
│   │   ├── index.vue       # トップページ（ルーム作成/参加）
│   │   ├── room/[code].vue # 待機室
│   │   ├── game/[code].vue # ゲーム本体
│   │   └── result/[code].vue # 結果画面
│   └── composables/
│       ├── usePartyKit.ts  # PartyKit 接続管理
│       ├── useGameState.ts # ゲーム状態管理
│       ├── useCardLogic.ts # カード出せる判定
│       ├── useRuleEngine.ts # ルール効果処理
│       └── useCpuAi.ts    # CPU 思考ロジック
├── party/
│   └── index.ts           # PartyKit サーバー
├── types/
│   └── index.ts           # 型定義
├── utils/
│   ├── deck.ts            # デッキ生成・シャッフル
│   ├── cpuNames.ts        # CPU 名前リスト
│   └── rules.ts           # ルール定義・デフォルト値
├── i18n/
│   └── locales/
│       ├── ja.json        # 日本語
│       └── en.json        # English
├── i18n.config.ts
├── nuxt.config.ts
└── partykit.json
```

## デプロイ

### Vercel

```bash
# Vercel CLI でデプロイ
vercel
```

### PartyKit

```bash
# PartyKit にデプロイ
npx partykit deploy
```
