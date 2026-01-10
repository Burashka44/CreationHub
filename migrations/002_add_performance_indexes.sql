-- Performance Optimization: Add indexes for timestamp-based queries
-- Date: 2026-01-10
-- Purpose: Dramatically improve query performance for dashboard metrics

-- Add indexes on timestamp columns (used in ORDER BY ... DESC LIMIT 1 queries)
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_disk_snapshots_timestamp ON disk_snapshots(timestamp DESC);

-- Composite index for filtered queries (e.g., WHERE name = 'System' ORDER BY timestamp DESC)
CREATE INDEX IF NOT EXISTS idx_disk_snapshots_name_timestamp ON disk_snapshots(name, timestamp DESC);

-- Note: network_traffic already has idx_network_traffic_recorded_at

-- Verify indexes
SELECT 
    schemaname,
    tablename, 
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes 
JOIN pg_class ON pg_class.relname = indexname
WHERE tablename IN ('system_metrics', 'disk_snapshots', 'network_traffic')
    AND schemaname = 'public'
ORDER BY tablename, indexname;
