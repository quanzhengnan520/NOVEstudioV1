-- migrate:up
CREATE TABLE nove_studio_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  bullmq_job_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  error_message text,
  credits_amount integer NOT NULL DEFAULT 0 CHECK (credits_amount >= 0),
  credits_charged boolean NOT NULL DEFAULT false,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nove_studio_tasks_type_chk CHECK (task_type IN ('chat', 'prompt', 'image', 'video')),
  CONSTRAINT nove_studio_tasks_status_chk CHECK (status IN ('queued', 'processing', 'succeeded', 'failed'))
);

CREATE INDEX nove_studio_tasks_user_created_idx ON nove_studio_tasks(user_id, created_at DESC);
CREATE INDEX nove_studio_tasks_status_idx ON nove_studio_tasks(status);
CREATE INDEX nove_studio_tasks_type_idx ON nove_studio_tasks(task_type);

CREATE TABLE nove_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX nove_feedback_created_idx ON nove_feedback(created_at DESC);

-- migrate:down
DROP TABLE IF EXISTS nove_feedback;
DROP TABLE IF EXISTS nove_studio_tasks;
