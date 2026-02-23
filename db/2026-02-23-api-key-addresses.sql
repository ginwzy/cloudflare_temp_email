CREATE TABLE IF NOT EXISTS api_key_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_id INTEGER NOT NULL,
    address TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_api_key_addresses_key_id ON api_key_addresses(key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_addresses_address ON api_key_addresses(address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_key_addresses_key_address ON api_key_addresses(key_id, address);
