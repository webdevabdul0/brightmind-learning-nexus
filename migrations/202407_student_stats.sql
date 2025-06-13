-- Migration: Create student_stats table for per-student, per-day stats
CREATE TABLE IF NOT EXISTS student_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    hours_studied numeric NOT NULL DEFAULT 0,
    community_score integer NOT NULL DEFAULT 0,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (student_id, date)
);
-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_student_stats_student_date ON student_stats(student_id, date); 