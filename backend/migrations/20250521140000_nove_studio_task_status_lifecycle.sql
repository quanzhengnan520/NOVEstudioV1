-- migrate:up
-- R9: unify terminal success state as `completed` (was `succeeded`). Adds `cancelled` for future use.
ALTER TABLE nove_studio_tasks DROP CONSTRAINT IF EXISTS nove_studio_tasks_status_chk;

UPDATE nove_studio_tasks SET status = 'completed' WHERE status = 'succeeded';

ALTER TABLE nove_studio_tasks
  ADD CONSTRAINT nove_studio_tasks_status_chk
  CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled'));

COMMENT ON CONSTRAINT nove_studio_tasks_status_chk ON nove_studio_tasks IS
  'Unified studio lifecycle: queued → processing → completed|failed|cancelled';

-- migrate:down
ALTER TABLE nove_studio_tasks DROP CONSTRAINT IF EXISTS nove_studio_tasks_status_chk;

UPDATE nove_studio_tasks SET status = 'succeeded' WHERE status = 'completed';
UPDATE nove_studio_tasks SET status = 'failed' WHERE status = 'cancelled';

ALTER TABLE nove_studio_tasks
  ADD CONSTRAINT nove_studio_tasks_status_chk
  CHECK (status IN ('queued', 'processing', 'succeeded', 'failed'));
