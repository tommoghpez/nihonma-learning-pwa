# MA NAVI — 開発ガイドライン

## プロジェクト概要
- 社内動画ラーニングPWA（React 18 + TypeScript + Vite + Tailwind + Zustand + Supabase）
- 本番URL: https://ma-navi.vercel.app
- Supabase project ref: rrwvpxckbuiufmxiopxi
- 開発者メール: tim.tom.0510@gmail.com

## デプロイ前チェック（コミット・プッシュ時に必ず実行）

コードを変更してコミット・プッシュする前に、以下を **この順番で** 実行すること：

### 1. 型チェック
```
npx tsc --noEmit
```
エラーが0件であること。未使用importなども修正する。

### 2. ビルド確認
```
npx vite build
```
ビルド成功すること。警告は許容するがエラーは修正する。

### 3. APP_VERSION 更新
`index.html` 内の `APP_VERSION` をインクリメントする。
これを忘れるとSafari PWAユーザーが古いキャッシュから抜けられない。
```
例: '2.4.0' → '2.5.0'
```

### 4. Vercel SPA設定の確認（新規ルート追加時のみ）
`vercel.json` に `rewrites` ルールがあることを確認。
これがないと `/videos` 等の直接アクセスで404になる。

### 5. プッシュ後
Vercelの自動デプロイを待ち、本番URLで動作確認を促す。

## DB 変更時のルール

### テーブル作成・変更
- Supabase Management API経由でSQLを実行する場合、実行したSQLをコミットメッセージに記載すること
- RLS（Row Level Security）を必ず有効化する
- FK制約は **ON DELETE RESTRICT** のみ使用（CASCADEは禁止）
- DELETE操作を伴う機能は実装しない（論理削除を検討）

### 接続情報
```
SUPABASE_ACCESS_TOKEN=sbp_a7e49cabc9d39edeac3bc908975beb420e0a084b
PROJECT_REF=rrwvpxckbuiufmxiopxi
```

## コーディング規約

### 全般
- TypeScript strict mode（型エラーゼロを維持）
- Tailwind CSSでスタイリング（inline styleは最小限）
- Zustandでグローバル状態管理
- 開発者専用機能は `DEVELOPER_EMAILS` でガード

### コンポーネント設計
- ページ: `src/pages/` に配置
- 共通UI: `src/components/common/`
- 機能別: `src/components/{feature}/`

### アニメーション
- 見た目だけの動き → CSS animation / Tailwind animate
- タイミング同期が必要な動き → requestAnimationFrame（JSベース）

## PWA 注意事項
- Service Worker設定: `skipWaiting: true`, `clientsClaim: true`, `registerType: 'autoUpdate'`
- Safari/iOS ではSWキャッシュが強力に残るため、APP_VERSIONによる強制クリア機構あり
- 1時間ごとにSW更新チェック（`main.tsx`）

## やらないこと（意図的な制限）
- 学習パスの自動分類（後で手動設計予定。LearningPath.tsxは残してある）
- パスワードゲートのパスワード変更（現在ハードコード: "bwed"）
- DB migrations のファイル管理（現状はAPI直接実行）
