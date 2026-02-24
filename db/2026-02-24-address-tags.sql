-- Add tags column to address table for categorizing addresses
-- Stores JSON array of tag strings, e.g. '["twitter","signup"]'
-- Use json_each(tags) for querying by tag

ALTER TABLE address ADD COLUMN tags TEXT DEFAULT '[]';
