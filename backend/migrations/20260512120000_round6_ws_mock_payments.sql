-- migrate:up
CREATE TABLE IF NOT EXISTS ws_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  socket_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_ping timestamptz
);
CREATE INDEX IF NOT EXISTS ws_connections_user_id_idx ON ws_connections (user_id);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  provider text NOT NULL DEFAULT 'mock',
  status text NOT NULL DEFAULT 'pending',
  provider_order_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments (user_id);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments (created_at DESC);

CREATE TABLE IF NOT EXISTS provider_fallbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type text NOT NULL UNIQUE,
  provider_order text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO provider_fallbacks (task_type, provider_order)
VALUES ('video', ARRAY['volcengine-ark', 'ark-fallback']::text[])
ON CONFLICT (task_type) DO NOTHING;

-- migrate:down
DROP TABLE IF EXISTS provider_fallbacks;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS ws_connections;
