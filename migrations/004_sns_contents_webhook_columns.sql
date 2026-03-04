-- Migration: Add webhook integration columns to sns_contents
-- Phase 3: SNS自動予約投稿（Make/Zapier連携）

ALTER TABLE sns_contents
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS platform_post_id VARCHAR(255);

-- Index for webhook scheduled content lookup
CREATE INDEX IF NOT EXISTS idx_sns_contents_status ON sns_contents (status);
