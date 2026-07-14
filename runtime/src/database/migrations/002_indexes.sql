-- Migration 002: Performance indexes
-- These indexes are critical for the StateManager's cache invalidation queries
-- and for session lookups by workspace.

CREATE INDEX IF NOT EXISTS idx_sessions_workspace_id
  ON sessions(workspace_id);

CREATE INDEX IF NOT EXISTS idx_learning_progress_workspace_id
  ON learning_progress(workspace_id);

CREATE INDEX IF NOT EXISTS idx_milestones_workspace_id
  ON milestones(workspace_id);

CREATE INDEX IF NOT EXISTS idx_milestones_order
  ON milestones(workspace_id, order_index);

CREATE INDEX IF NOT EXISTS idx_dependency_metrics_workspace_id
  ON dependency_metrics(workspace_id);
