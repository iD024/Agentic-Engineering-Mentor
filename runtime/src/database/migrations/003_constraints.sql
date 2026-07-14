-- Migration 003: Additional constraints and triggers
-- Automatically updates the updated_at column on every row modification.
-- This is critical for cache invalidation — StateCache can compare
-- updated_at timestamps to know when to refresh.

CREATE TRIGGER IF NOT EXISTS trg_workspaces_updated_at
  AFTER UPDATE ON workspaces
  BEGIN
    UPDATE workspaces SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS trg_sessions_updated_at
  AFTER UPDATE ON sessions
  BEGIN
    UPDATE sessions SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS trg_learning_progress_updated_at
  AFTER UPDATE ON learning_progress
  BEGIN
    UPDATE learning_progress SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS trg_milestones_updated_at
  AFTER UPDATE ON milestones
  BEGIN
    UPDATE milestones SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS trg_dependency_metrics_updated_at
  AFTER UPDATE ON dependency_metrics
  BEGIN
    UPDATE dependency_metrics SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS trg_settings_updated_at
  AFTER UPDATE ON settings
  BEGIN
    UPDATE settings SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE key = NEW.key;
  END;
