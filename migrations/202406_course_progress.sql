-- Migration: Create course_progress table for per-student, per-course progress tracking
CREATE TABLE IF NOT EXISTS course_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    percent integer NOT NULL DEFAULT 0,
    completed integer NOT NULL DEFAULT 0,
    total integer NOT NULL DEFAULT 0,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (student_id, course_id)
);
-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_course_progress_student_course ON course_progress(student_id, course_id); 