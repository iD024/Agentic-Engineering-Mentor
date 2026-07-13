-- Migration 004: Seed default settings
-- Seeds the settings table with known application defaults.
-- Uses INSERT OR IGNORE so re-running this migration is safe.

INSERT OR IGNORE INTO settings (key, value) VALUES ('runtime.version', '2.0.0');
INSERT OR IGNORE INTO settings (key, value) VALUES ('runtime.stage', '2');
INSERT OR IGNORE INTO settings (key, value) VALUES ('export.enabled', 'true');
INSERT OR IGNORE INTO settings (key, value) VALUES ('import.autoRun', 'true');
