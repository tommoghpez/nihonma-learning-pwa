-- リアクション機能: いいね/リアクションテーブル
-- Supabase SQL Editorで実行済み

CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  progress_id UUID REFERENCES watch_progress(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('👍', '🔥', '👏', '💪')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, progress_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_progress ON reactions(progress_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reactions" ON reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete reactions" ON reactions FOR DELETE USING (true);
