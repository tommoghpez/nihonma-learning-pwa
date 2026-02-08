# YouTube同期 Edge Function

毎日深夜3時（日本時間）に自動でYouTubeチャンネルの動画を同期します。

## セットアップ手順

### 1. Supabase CLIのインストール（まだの場合）

```bash
npm install -g supabase
```

### 2. Supabaseプロジェクトにログイン

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. 環境変数の設定

Supabase Dashboard > Settings > Edge Functions > Add new secret で以下を追加：

| 名前 | 値 |
|------|-----|
| `YOUTUBE_API_KEY` | YouTube Data API v3のAPIキー |
| `YOUTUBE_CHANNEL_ID` | 日本M&AセンターのチャンネルID |

※ `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` は自動で設定されます

### 4. Edge Functionのデプロイ

```bash
cd /path/to/nihonma-learning-pwa
supabase functions deploy sync-youtube
```

### 5. pg_cron拡張の有効化

Supabase Dashboard > Database > Extensions で `pg_cron` を有効化

### 6. Cronジョブの設定

Supabase Dashboard > SQL Editor で以下を実行：

```sql
-- 既存のジョブがあれば削除
SELECT cron.unschedule('sync-youtube-daily');

-- 毎日UTC 18:00（日本時間 03:00）に実行
SELECT cron.schedule(
  'sync-youtube-daily',
  '0 18 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-youtube',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**注意**: `YOUR_PROJECT_REF` と `YOUR_SERVICE_ROLE_KEY` は実際の値に置き換えてください。
- Project Ref: Supabase Dashboard > Settings > General
- Service Role Key: Supabase Dashboard > Settings > API > service_role (secret)

### 7. 動作確認

```sql
-- ジョブの確認
SELECT * FROM cron.job;

-- 手動実行（テスト）
SELECT
  net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-youtube',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
```

## 手動同期

開発者（tim.tom.0510@gmail.com）のみ、フロントエンドの「YouTube同期」ボタンから手動同期が可能です。

## ログの確認

```sql
SELECT * FROM sync_logs ORDER BY synced_at DESC LIMIT 10;
```

## トラブルシューティング

### Cronが実行されない
- pg_cron拡張が有効か確認
- `SELECT * FROM cron.job;` でジョブが登録されているか確認

### 同期エラー
- Edge FunctionのログをSupabase Dashboardで確認
- YouTube APIのクォータを確認（1日10,000ユニット）

### 権限エラー
- Service Role Keyが正しいか確認
- Edge Functionの環境変数が設定されているか確認
