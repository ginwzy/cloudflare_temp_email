ALTER TABLE api_keys ADD COLUMN last_used_at DATETIME;
ALTER TABLE api_keys ADD COLUMN last_used_ip TEXT;

CREATE TABLE IF NOT EXISTS api_idempotency (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_id INTEGER NOT NULL,
    idem_key TEXT NOT NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    response_body TEXT NOT NULL,
    status_code INTEGER NOT NULL DEFAULT 200,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_idempotency_unique ON api_idempotency(key_id, idem_key, method, path);
