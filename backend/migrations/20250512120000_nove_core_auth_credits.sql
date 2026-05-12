-- migrate:up
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  credits_balance integer NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens(user_id);
CREATE INDEX refresh_tokens_expires_at_idx ON refresh_tokens(expires_at);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_type text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  credits_amount integer NOT NULL CHECK (credits_amount >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_id_idx ON orders(user_id);
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);

CREATE TABLE credit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  reason text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX credit_logs_user_id_idx ON credit_logs(user_id);
CREATE INDEX credit_logs_order_id_idx ON credit_logs(order_id);
CREATE INDEX credit_logs_created_at_idx ON credit_logs(created_at DESC);

CREATE TABLE image_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  prompt text,
  result_url text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX image_tasks_user_id_idx ON image_tasks(user_id);
CREATE INDEX image_tasks_status_idx ON image_tasks(status);

CREATE TABLE video_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  prompt text,
  credits_cost integer NOT NULL CHECK (credits_cost >= 0),
  result_url text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX video_tasks_user_id_idx ON video_tasks(user_id);
CREATE INDEX video_tasks_status_idx ON video_tasks(status);

-- migrate:down
DROP TABLE IF EXISTS video_tasks;
DROP TABLE IF EXISTS image_tasks;
DROP TABLE IF EXISTS credit_logs;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
