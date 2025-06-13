import { useState, useEffect } from 'react';
// @ts-ignore
import { supabase } from '@/integrations/supabase/client';

export function useAllCoursesProgress(courseIds: string[], userId: string | undefined) {
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!userId || !courseIds.length) {
      setProgressMap({});
      return;
    }
    const fetchProgress = async () => {
      const map: Record<string, number> = {};
      for (const courseId of courseIds) {
        // Fetch lessons and assignments count
        const { data: lessons = [] } = await supabase
          .from('course_lessons')
          .select('id')
          .eq('course_id', courseId);
        const { data: assignments = [] } = await supabase
          .from('assignments')
          .select('id')
          .eq('course_id', courseId);
        // Fetch completed lessons for this user and course
        const { data: courseLessons } = await supabase
          .from('course_lessons')
          .select('id')
          .eq('course_id', courseId);
        const lessonIds = courseLessons ? courseLessons.map((l: any) => l.id) : [];
        const { data: completedLessons } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('student_id', userId)
          .eq('completed', true);
        const completedLessonIds = completedLessons ? completedLessons.map((l: any) => l.lesson_id) : [];
        const completedLessonsCount = lessonIds.filter((id: any) => completedLessonIds.includes(id)).length;
        // Fetch completed assignments for this user and course
        const { data: assignmentIds } = await supabase
          .from('assignments')
          .select('id')
          .eq('course_id', courseId);
        const allAssignmentIds = assignmentIds ? assignmentIds.map((a: any) => a.id) : [];
        const { data: completedAssignments } = await supabase
          .from('assignment_submissions')
          .select('assignment_id')
          .eq('student_id', userId)
          .eq('status', 'completed');
        const completedAssignmentIds = completedAssignments ? completedAssignments.map((a: any) => a.assignment_id) : [];
        const completedAssignmentsCount = allAssignmentIds.filter((id: any) => completedAssignmentIds.includes(id)).length;
        // Calculate totals
        const total = (lessons?.length || 0) + (assignments?.length || 0);
        const completed = completedLessonsCount + completedAssignmentsCount;
        const percent = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
        map[courseId] = percent;
      }
      setProgressMap(map);
    };
    fetchProgress();
  }, [courseIds, userId]);
  return progressMap;
} 