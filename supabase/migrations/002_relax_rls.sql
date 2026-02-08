-- RLSポリシーを緩和して、認証済みユーザーが操作できるようにする
-- Supabase SQL Editorで以下を1つずつ実行してください

-- 1. watch_progress テーブル
DROP POLICY IF EXISTS "Users can insert own progress" ON watch_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON watch_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON watch_progress;

CREATE POLICY "Anyone can insert progress" ON watch_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update progress" ON watch_progress FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete progress" ON watch_progress FOR DELETE USING (true);

-- 2. quiz_results テーブル
DROP POLICY IF EXISTS "Users can insert own results" ON quiz_results;
DROP POLICY IF EXISTS "Users can update own results" ON quiz_results;

CREATE POLICY "Anyone can insert results" ON quiz_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update results" ON quiz_results FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete results" ON quiz_results FOR DELETE USING (true);

-- 3. summaries テーブル（ノート）
DROP POLICY IF EXISTS "Users can insert own summaries" ON summaries;
DROP POLICY IF EXISTS "Users can update own summaries" ON summaries;
DROP POLICY IF EXISTS "Users can delete own summaries" ON summaries;

CREATE POLICY "Anyone can insert summaries" ON summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update summaries" ON summaries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete summaries" ON summaries FOR DELETE USING (true);

-- 4. users テーブル（プロフィール更新用）
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Anyone can update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);
