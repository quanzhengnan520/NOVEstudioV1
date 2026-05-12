-- migrate:up
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

UPDATE users SET email_verified_at = now() WHERE email_verified_at IS NULL;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_verification_tokens_user_id_idx ON email_verification_tokens(user_id);

CREATE TABLE IF NOT EXISTS registration_ip_events (
  id bigserial PRIMARY KEY,
  ip text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS registration_ip_events_ip_created_idx ON registration_ip_events(ip, created_at DESC);

-- migrate:down
DROP TABLE IF EXISTS registration_ip_events;
DROP TABLE IF EXISTS email_verification_tokens;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified_at;
