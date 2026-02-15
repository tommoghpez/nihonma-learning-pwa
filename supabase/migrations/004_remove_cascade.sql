-- 再発防止: video_id 外部キーの ON DELETE CASCADE → ON DELETE RESTRICT に変更
-- 背景: sync-youtube Edge Function が videos テーブルを全削除した際、
--       CASCADE により watch_progress / summaries のデータも全消失した。
--       RESTRICT に変更することで、関連データがある動画は削除不可にする。

-- watch_progress.video_id
ALTER TABLE watch_progress DROP CONSTRAINT watch_progress_video_id_fkey;
ALTER TABLE watch_progress ADD CONSTRAINT watch_progress_video_id_fkey
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE RESTRICT;

-- summaries.video_id
ALTER TABLE summaries DROP CONSTRAINT summaries_video_id_fkey;
ALTER TABLE summaries ADD CONSTRAINT summaries_video_id_fkey
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE RESTRICT;

-- quiz_questions.video_id
ALTER TABLE quiz_questions DROP CONSTRAINT quiz_questions_video_id_fkey;
ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_video_id_fkey
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE RESTRICT;

-- quiz_results.video_id
ALTER TABLE quiz_results DROP CONSTRAINT quiz_results_video_id_fkey;
ALTER TABLE quiz_results ADD CONSTRAINT quiz_results_video_id_fkey
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE RESTRICT;
