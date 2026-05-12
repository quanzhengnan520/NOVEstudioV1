-- migrate:up
-- R9: legacy task tables are compatibility-only; canonical data is nove_studio_tasks.
COMMENT ON TABLE image_tasks IS 'LEGACY — compatibility only. Do not use for new features. Scheduled for removal.';
COMMENT ON TABLE video_tasks IS 'LEGACY — compatibility only. Do not use for new features. Scheduled for removal.';

ALTER TABLE nove_studio_tasks ADD COLUMN IF NOT EXISTS last_remote_poll_at timestamptz;
COMMENT ON COLUMN nove_studio_tasks.last_remote_poll_at IS 'Throttles remote provider polling (dynamic intervals).';

-- See also: 20250521140000_nove_studio_task_status_lifecycle.sql (completed / cancelled lifecycle).

CREATE INDEX IF NOT EXISTS nove_studio_tasks_video_remote_poll_idx
  ON nove_studio_tasks (task_type, status, last_remote_poll_at, created_at)
  WHERE task_type = 'video' AND remote_task_id IS NOT NULL AND credits_charged = false;

-- migrate:down
DROP INDEX IF EXISTS nove_studio_tasks_video_remote_poll_idx;
ALTER TABLE nove_studio_tasks DROP COLUMN IF EXISTS last_remote_poll_at;
