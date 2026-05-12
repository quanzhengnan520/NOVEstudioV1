-- migrate:up
ALTER TABLE image_tasks ADD COLUMN IF NOT EXISTS studio_task_id uuid REFERENCES nove_studio_tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS image_tasks_studio_task_id_idx ON image_tasks(studio_task_id);

ALTER TABLE video_tasks ADD COLUMN IF NOT EXISTS studio_task_id uuid REFERENCES nove_studio_tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS video_tasks_studio_task_id_idx ON video_tasks(studio_task_id);

CREATE TABLE nove_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  studio_task_id uuid NOT NULL REFERENCES nove_studio_tasks(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nove_chat_messages_role_chk CHECK (role IN ('user', 'assistant', 'system'))
);
CREATE INDEX nove_chat_messages_user_created_idx ON nove_chat_messages(user_id, created_at DESC);
CREATE INDEX nove_chat_messages_studio_task_idx ON nove_chat_messages(studio_task_id);

-- migrate:down
DROP TABLE IF EXISTS nove_chat_messages;
ALTER TABLE video_tasks DROP COLUMN IF EXISTS studio_task_id;
ALTER TABLE image_tasks DROP COLUMN IF EXISTS studio_task_id;
