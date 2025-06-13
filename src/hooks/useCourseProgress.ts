import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface CourseProgressResult {
  percent: number;
  completed: number;
  total: number;
}

function useLessons(courseId: string) {
  return useQuery<any[]>({
    queryKey: ['courseLessons', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('course_lessons')
        .select('id, type')
        .eq('course_id', courseId);
      if (error) return [];
      return data || [];
    },
    enabled: !!courseId
  });
}

function useAssignments(courseId: string) {
  return useQuery<any[]>({
    queryKey: ['courseAssignments', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('assignments')
        .select('id')
        .eq('course_id', courseId);
      if (error) return [];
      return data || [];
    },
    enabled: !!courseId
  });
}

function useCompletedLessons(courseId: string, userId: string | undefined) {
  return useQuery<any[]>({
    queryKey: ['completedLessons', courseId, userId],
    queryFn: async () => {
      if (!courseId || !userId) return [];
      // Get all lesson IDs for the course
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id')
        .eq('course_id', courseId);
      const lessonIds = courseLessons ? courseLessons.map((l: any) => l.id) : [];
      // Get all completed lessons for the student
      const { data: completedLessons } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', userId)
        .eq('completed', true);
      const completedLessonIds = completedLessons ? completedLessons.map((l: any) => l.lesson_id) : [];
      // Return only those completed that are in this course
      return lessonIds.filter((id: any) => completedLessonIds.includes(id));
    },
    enabled: !!courseId && !!userId
  });
}

function useCompletedAssignments(courseId: string, userId: string | undefined) {
  return useQuery<any[]>({
    queryKey: ['completedAssignments', courseId, userId],
    queryFn: async () => {
      if (!courseId || !userId) return [];
      const { data } = await supabase
        .from('assignments')
        .select('id')
        .eq('course_id', courseId);
      const assignmentIds = data ? data.map((a: any) => a.id) : [];
      const { data: completedAssignments } = await supabase
        .from('assignment_submissions')
        .select('assignment_id')
        .eq('student_id', userId)
        .eq('status', 'completed');
      const completedAssignmentIds = completedAssignments ? completedAssignments.map((a: any) => a.assignment_id) : [];
      // Return only those completed that are in this course
      return assignmentIds.filter((id: any) => completedAssignmentIds.includes(id));
    },
    enabled: !!courseId && !!userId
  });
}

export function useCourseProgress(courseId: string, userId: string | undefined): CourseProgressResult {
  const { data: lessons = [] } = useLessons(courseId);
  const { data: assignments = [] } = useAssignments(courseId);
  const { data: completedLessons = [] } = useCompletedLessons(courseId, userId);
  const { data: completedAssignments = [] } = useCompletedAssignments(courseId, userId);

  // Calculate total items (all lessons + assignments)
  const total = lessons.length + assignments.length;
  // Calculate completed items
  const completedLessonsCount = completedLessons.length;
  const completedAssignmentsCount = completedAssignments.length;
  const completed = completedLessonsCount + completedAssignmentsCount;
  // Calculate percentage
  const percent = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
  // Debug log
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Course ${courseId} progress:`, {
      total,
      completed,
      lessons: lessons.length,
      assignments: assignments.length,
      completedLessons: completedLessonsCount,
      completedAssignments: completedAssignmentsCount
    });
  }

  return {
    percent,
    completed,
    total
  };
}

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