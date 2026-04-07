-- Migration: Create rate_limit_log table for rate limiting
-- Requirements: 30, 31
-- Description: Creates a table to track user operations for rate limiting (60 requests per minute)

-- Create rate_limit_log table
CREATE TABLE rate_limit_log (
  user_id UUID NOT NULL,
  operation TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, operation, timestamp)
);

-- Create index for efficient rate limit queries
-- This index allows fast lookups of recent requests by user
CREATE INDEX idx_rate_limit_log_user_time 
  ON rate_limit_log(user_id, timestamp DESC);

-- Add comment to table for documentation
COMMENT ON TABLE rate_limit_log IS 'Logs user operations for rate limiting enforcement (60 requests per minute per user)';
COMMENT ON COLUMN rate_limit_log.user_id IS 'UUID of the user making the request';
COMMENT ON COLUMN rate_limit_log.operation IS 'Name of the operation being rate limited (e.g., cart_items, wishlist_items)';
COMMENT ON COLUMN rate_limit_log.timestamp IS 'Timestamp when the operation was performed';
