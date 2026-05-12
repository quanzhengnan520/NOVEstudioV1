-- migrate:up
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_frozen integer NOT NULL DEFAULT 0 CHECK (credits_frozen >= 0);

ALTER TABLE nove_studio_tasks ADD COLUMN IF NOT EXISTS remote_task_id text;
ALTER TABLE nove_studio_tasks ADD COLUMN IF NOT EXISTS processing_deadline timestamptz;
ALTER TABLE nove_studio_tasks ADD COLUMN IF NOT EXISTS credits_reserved boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS nove_provider_metrics (
  provider_name text PRIMARY KEY,
  fail_streak integer NOT NULL DEFAULT 0,
  circuit_open_until timestamptz,
  total_requests bigint NOT NULL DEFAULT 0,
  total_latency_ms bigint NOT NULL DEFAULT 0,
  last_failure_at timestamptz,
  last_failure_message text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nove_studio_tasks_video_poll_idx
  ON nove_studio_tasks (status, updated_at)
  WHERE task_type = 'video' AND remote_task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS nove_studio_tasks_processing_deadline_idx
  ON nove_studio_tasks (processing_deadline)
  WHERE status = 'processing';

-- migrate:down
DROP INDEX IF EXISTS nove_studio_tasks_processing_deadline_idx;
DROP INDEX IF EXISTS nove_studio_tasks_video_poll_idx;
DROP TABLE IF EXISTS nove_provider_metrics;
ALTER TABLE nove_studio_tasks DROP COLUMN IF EXISTS credits_reserved;
ALTER TABLE nove_studio_tasks DROP COLUMN IF EXISTS processing_deadline;
ALTER TABLE nove_studio_tasks DROP COLUMN IF EXISTS remote_task_id;
ALTER TABLE users DROP COLUMN IF EXISTS credits_frozen;
