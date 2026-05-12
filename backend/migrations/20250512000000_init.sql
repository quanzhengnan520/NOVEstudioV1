-- migrate:up
CREATE TABLE IF NOT EXISTS rune_meta (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE IF EXISTS rune_meta;
