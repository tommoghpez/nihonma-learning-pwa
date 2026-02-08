-- YouTube同期の自動実行設定
-- 毎日深夜3時（日本時間）に実行 = UTC 18:00

-- pg_cron拡張が有効であることを確認
-- SupabaseダッシュボードでDatabase > Extensionsから有効化が必要

-- Cronジョブを作成
-- 注意: この設定はSupabase Dashboardから手動で行う必要があります
-- Database > Extensions > pg_cron を有効化後、
-- SQL Editorで以下を実行してください:

/*
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

-- ジョブの確認
SELECT * FROM cron.job;
*/

-- 同期ログテーブル（オプション）
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  video_count INTEGER,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLSは無効（内部使用のみ）
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみ読み取り可能
CREATE POLICY "Admins can read sync_logs" ON sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

COMMENT ON TABLE sync_logs IS 'YouTube同期の履歴ログ';
