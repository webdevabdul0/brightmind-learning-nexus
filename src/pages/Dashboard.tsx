import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, BookOpen, Clock, Users, Search, BellRing, Pencil, Trash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/providers/AuthProvider';
import StatCard from '@/components/dashboard/StatCard';
import CourseCard from '@/components/dashboard/CourseCard';
import { BarChart as ReBarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { supabase, Course, Enrollment } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// 1. Child component for live progress on course cards
const COURSE_COLORS = [
  'bg-brightmind-purple text-white',
  'bg-brightmind-blue text-white',
  'bg-blue-500 text-white',
  'bg-green-500 text-white',
  'bg-indigo-500 text-white',
  'bg-fuchsia-500 text-white',
  'bg-rose-500 text-white',
  'bg-orange-500 text-white',
  'bg-amber-500 text-white',
  'bg-emerald-500 text-white',
  'bg-cyan-500 text-white',
  'bg-violet-500 text-white',
  'bg-pink-500 text-white',
  'bg-red-500 text-white',
  'bg-blue-500 text-white',
  'bg-green-500 text-white',
  'bg-indigo-500 text-white',
];
function getRandomColor(idx: number) {
  return COURSE_COLORS[idx % COURSE_COLORS.length];
}
const CourseCardWithProgress = ({ course, profile, user, onClick }) => {
  const { completed, total } = useCourseProgress(course.id, user?.id);
  // Use a hash of course id and title for more randomness
  const hash = Math.abs(
    [...course.id + course.title].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  );
  const color = getRandomColor(hash);
  return (
    <CourseCard
      id={course.id}
      title={course.title}
      instructor={course.instructor?.name || course.instructor_name || 'Instructor'}
      color={color}
      progress={{
        completed: profile?.role === 'student' ? completed : 0,
        total: total
      }}
      onClick={onClick}
      isEnrolled={true}
      userRole={profile?.role}
    />
  );
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [viewSubmissionsDialogOpen, setViewSubmissionsDialogOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [grading, setGrading] = useState<{ [submissionId: string]: boolean }>({});
  const [grades, setGrades] = useState<{ [submissionId: string]: string }>({});
  const [feedbacks, setFeedbacks] = useState<{ [submissionId: string]: string }>({});
  const [editAssignmentDialogOpen, setEditAssignmentDialogOpen] = useState(false);
  const [editLiveClassDialogOpen, setEditLiveClassDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string, id: string } | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const queryClient = useQueryClient();

  // Teacher-specific queries
  const { data: teacherCourses = [], isLoading: isLoadingTeacherCourses } = useQuery({
    queryKey: ['teacherCourses', user?.id],
    queryFn: async () => {
      if (!user || profile?.role !== 'teacher') return [];
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && profile?.role === 'teacher',
  });

  const { data: teacherAssignments = [], isLoading: isLoadingTeacherAssignments } = useQuery({
    queryKey: ['teacherAssignments', user?.id],
    queryFn: async () => {
      if (!user || profile?.role !== 'teacher') return [];
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .in('course_id', teacherCourses.map((c: any) => c.id));
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && profile?.role === 'teacher' && teacherCourses.length > 0,
  });

  const { data: teacherLiveClasses = [], isLoading: isLoadingTeacherLiveClasses } = useQuery({
    queryKey: ['teacherLiveClasses', user?.id],
    queryFn: async () => {
      if (!user || profile?.role !== 'teacher') return [];
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .eq('instructor_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && profile?.role === 'teacher',
  });

  // Fetch enrolled courses
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('student_id', user.id);
      
      if (error) {
        toast({
          title: "Error fetching enrollments",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  // --- OVERALL PROGRESS CALCULATION ---
  // Only for students
  const isStudent = profile?.role === 'student';

  // Fetch all lessons and assignments for each enrolled course
  const courseIds = isStudent && enrollments ? enrollments.map((e: any) => e.course_id) : [];

  // --- NEW: Fetch progress for all courses in parallel ---
  const courseProgressResults = useQueries({
    queries: (enrollments || []).map((enrollment: any) => {
      const courseId = enrollment.course_id;
      return {
        queryKey: ['courseProgress', courseId, user?.id],
        queryFn: async () => {
          if (!courseId || !user?.id) return { percent: 0, completed: 0, total: 0 };
          const { data, error } = await supabase
            .from('course_progress')
            .select('percent, completed, total')
            .eq('student_id', user.id)
            .eq('course_id', courseId)
            .maybeSingle();
          if (error || !data) return { percent: 0, completed: 0, total: 0 };
          return data;
        },
        enabled: !!user && !!courseId && isStudent,
      };
    }),
  }) as any;

  // --- NEW: Map courseId to progress for quick lookup ---
  const courseIdToProgress: Record<string, { percent: number; completed: number; total: number }> = {};
  (enrollments || []).forEach((enrollment: any, idx: number) => {
    const courseId = enrollment.course_id;
    courseIdToProgress[courseId] =
      courseProgressResults[idx] && courseProgressResults[idx].data !== undefined
        ? courseProgressResults[idx].data
        : { percent: 0, completed: 0, total: 0 };
  });

  // Format total hours
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Calculate average progress across all enrolled courses
  const courseProgressValues = isStudent && courseProgressResults.length > 0
    ? courseProgressResults.map((result: any) => (result.data !== undefined ? result.data.percent : 0))
    : [];
  const averageProgress = courseProgressValues.length > 0
    ? Math.round(courseProgressValues.reduce((acc: number, val: number) => acc + val, 0) / courseProgressValues.length)
    : 0;

  // Calculate total completed courses
  const [totalCompleted, totalItems] = (() => {
    let completed = 0;
    let items = 0;
    if (isStudent && enrollments && enrollments.length > 0) {
      enrollments.forEach((enrollment: any, idx: number) => {
        if (courseProgressResults[idx] && courseProgressResults[idx].data !== undefined) {
          if (courseProgressResults[idx].data.percent === 100) completed += 1;
          items += 1;
        }
      });
    }
    return [completed, items];
  })();

  // Calculate number of courses in progress and completed
  const numCompleted = isStudent && enrollments && enrollments.length > 0
    ? enrollments.reduce((acc: number, enrollment: any, idx: number) => {
        const progress = courseProgressResults[idx]?.data;
        if (progress && progress.percent === 100) return acc + 1;
        return acc;
      }, 0)
    : 0;
  const numInProgress = isStudent && enrollments && enrollments.length > 0
    ? enrollments.reduce((acc: number, enrollment: any, idx: number) => {
        const progress = courseProgressResults[idx]?.data;
        if (progress && progress.percent < 100) return acc + 1;
        return acc;
      }, 0)
    : 0;

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleViewNotifications = () => {
    navigate('/notifications');
  };

  const fetchSubmissions = async (assignmentId: string) => {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('id, student_id, file_url, grade, feedback, status, submitted_at, student:student_id(name, email)')
      .eq('assignment_id', assignmentId);
    if (!error) setSubmissions(data || []);
  };

  const handleViewSubmissions = async (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setViewSubmissionsDialogOpen(true);
    await fetchSubmissions(assignmentId);
  };

  const handleGrade = async (submissionId: string, studentId: string) => {
    setGrading(g => ({ ...g, [submissionId]: true }));
    const grade = Number(grades[submissionId]);
    const feedback = feedbacks[submissionId] || '';
    const { error } = await supabase
      .from('assignment_submissions')
      .update({ grade, feedback, status: 'completed' })
      .eq('id', submissionId);
    setGrading(g => ({ ...g, [submissionId]: false }));
    if (!error) {
      toast({ title: 'Graded', description: 'Grade submitted.' });
      await fetchSubmissions(selectedAssignmentId!);
    } else {
      toast({ title: 'Failed to grade', description: error.message, variant: 'destructive' });
    }
  };

  const renderCourses = () => {
    if (isLoadingEnrollments) {
      return Array(3).fill(0).map((_, i) => (
        <div key={i} className="rounded-xl p-6 bg-slate-100">
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="mt-12">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full mt-2" />
            </div>
          </div>
        </div>
      ));
    }

    if (!enrollments || enrollments.length === 0) {
      return (
        <div className="col-span-full text-center p-8 bg-slate-50 rounded-xl">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No enrolled courses yet</h3>
          <p className="text-muted-foreground mb-4">Explore our catalog and enroll in courses to get started.</p>
          <Button onClick={() => navigate('/courses')}>Browse courses</Button>
        </div>
      );
    }

    return enrollments
      .filter((enrollment: any) => {
        const course = enrollment.course;
        return course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (course.instructor_name && course.instructor_name.toLowerCase().includes(searchQuery.toLowerCase()));
      })
      .slice(0, 3)
      .map((enrollment: any, idx: number) => {
        const course = enrollment.course;
        
        // Use a hash of course id and title for more randomness
        const hash = Math.abs(
          [...course.id + course.title].reduce((acc, c) => acc + c.charCodeAt(0), 0)
        );
        const color = getRandomColor(hash);
        
        // Get progress from courseIdToProgress
        const progress = courseIdToProgress[course.id] || { percent: 0, completed: 0, total: 0 };
        return (
          <CourseCardWithProgress
            key={course.id}
            course={course}
            profile={profile}
            user={user}
            onClick={() => handleCourseClick(course.id)}
          />
        );
      });
  };

  // 2. Fetch real study stats and community score
  const { data: studyStatsRaw, isLoading: isLoadingStats } = useQuery({
    queryKey: ['studentStats', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get all completed lessons for this user
      const { data: completedLessons } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed_at')
        .eq('student_id', user.id)
        .eq('completed', true);
      if (!completedLessons) return [];
      // Get lesson durations
      const lessonIds = completedLessons.map(l => l.lesson_id);
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, duration')
        .in('id', lessonIds);
      // Map lessonId to duration
      const lessonDurationMap = {};
      (lessons || []).forEach(l => { lessonDurationMap[l.id] = l.duration || 0; });
      // Aggregate by day
      const statsByDay = {};
      completedLessons.forEach(l => {
        const date = l.completed_at ? l.completed_at.split('T')[0] : 'unknown';
        if (!statsByDay[date]) statsByDay[date] = { hours: 0, lessons: 0 };
        statsByDay[date].hours += (lessonDurationMap[l.lesson_id] || 0) / 60;
        statsByDay[date].lessons += 1;
      });
      // Fetch assignments completed
      const { data: completedAssignments } = await supabase
        .from('assignment_submissions')
        .select('id, submitted_at')
        .eq('student_id', user.id)
        .eq('status', 'completed');
      // Aggregate assignment completions by day
      (completedAssignments || []).forEach(a => {
        const date = a.submitted_at ? a.submitted_at.split('T')[0] : 'unknown';
        if (!statsByDay[date]) statsByDay[date] = { hours: 0, lessons: 0, assignments: 0 };
        statsByDay[date].assignments = (statsByDay[date].assignments || 0) + 1;
      });
      // Build week/month arrays
      const today = new Date();
      const week = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0];
        week.push({
          day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
          hours: +(statsByDay[key]?.hours || 0).toFixed(2),
          lessons: statsByDay[key]?.lessons || 0,
          assignments: statsByDay[key]?.assignments || 0
        });
      }
      // For month, last 30 days
      const month = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0];
        month.push({
          day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          hours: +(statsByDay[key]?.hours || 0).toFixed(2),
          lessons: statsByDay[key]?.lessons || 0,
          assignments: statsByDay[key]?.assignments || 0
        });
      }
      // Calculate total hours
      const totalHours = Object.values(statsByDay).reduce((sum, s) => sum + (s.hours || 0), 0);
      // Calculate community score (cool logic)
      let communityScore = 0;
      Object.values(statsByDay).forEach((s: any) => {
        communityScore += (s.lessons || 0) * 10;
        communityScore += (s.assignments || 0) * 20;
        if ((s.hours || 0) > 1) communityScore += 5;
      });
      return { week, month, totalHours, communityScore };
    },
    enabled: !!user
  });

  // Ensure studyStats is always an object with the right shape
  const studyStats = studyStatsRaw && !Array.isArray(studyStatsRaw)
    ? studyStatsRaw
    : { week: [], month: [], totalHours: 0, communityScore: 0 };

  // Assignment update/delete mutations
  const updateAssignmentMutation = useMutation({
    mutationFn: async (assignment) => {
      const { error } = await supabase.from('assignments').update(assignment).eq('id', assignment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherAssignments', user?.id] });
      setEditAssignmentDialogOpen(false);
      setEditItem(null);
      toast({ title: 'Assignment updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update assignment', description: error.message, variant: 'destructive' });
    }
  });
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherAssignments', user?.id] });
      setDeleteConfirm(null);
      toast({ title: 'Assignment deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete assignment', description: error.message, variant: 'destructive' });
    }
  });
  // Live class update/delete mutations
  const updateLiveClassMutation = useMutation({
    mutationFn: async (liveClass) => {
      const { error } = await supabase.from('live_classes').update(liveClass).eq('id', liveClass.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherLiveClasses', user?.id] });
      setEditLiveClassDialogOpen(false);
      setEditItem(null);
      toast({ title: 'Live class updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update live class', description: error.message, variant: 'destructive' });
    }
  });
  const deleteLiveClassMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('live_classes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherLiveClasses', user?.id] });
      setDeleteConfirm(null);
      toast({ title: 'Live class deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete live class', description: error.message, variant: 'destructive' });
    }
  });

  if (profile?.role === 'teacher') {
    return (
      <div className="container mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Teacher Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.name || 'Teacher'}</p>
        </div>
        <h2 className="text-xl font-semibold mb-4">MY COURSES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isLoadingTeacherCourses ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="rounded-xl p-6 bg-slate-100">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="mt-12">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full mt-2" />
                  </div>
                </div>
              </div>
            ))
          ) : teacherCourses.length === 0 ? (
            <div className="col-span-full text-center p-8 bg-slate-50 rounded-xl">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-4">You have not registered as an instructor for any course.</p>
            </div>
          ) : (
            teacherCourses.map((course: any) => {
              // Vibrant color palette
              const colors = [
                'bg-brightmind-purple text-white',
                'bg-brightmind-blue text-white',
                'bg-blue-500 text-white',
                'bg-green-500 text-white',
                'bg-amber-500 text-white',
                'bg-indigo-500 text-white'
              ];
              const colorIndex = Math.abs(course.title.charCodeAt(0) + course.title.charCodeAt(course.title.length - 1)) % colors.length;
              return (
                <CourseCard 
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  instructor={course.instructor?.name || profile?.name || 'Teacher'}
                  color={colors[colorIndex]}
                  progress={{ completed: 0, total: 100 }}
                  onClick={() => navigate(`/courses/${course.id}`)}
                />
              );
            })
          )}
        </div>
        <h2 className="text-xl font-semibold mb-4">ASSIGNMENTS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isLoadingTeacherAssignments ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="rounded-xl p-6 bg-slate-100">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : teacherAssignments.length === 0 ? (
            <div className="col-span-full text-center p-8 bg-slate-50 rounded-xl">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No assignments yet</h3>
              <p className="text-muted-foreground mb-4">No assignments have been created for your courses.</p>
            </div>
          ) : (
            teacherAssignments.map((assignment: any) => (
              <div key={assignment.id} className="rounded-xl p-6 bg-white shadow flex flex-col gap-2">
                <div className="font-semibold text-lg mb-2 flex justify-between items-center">
                  <span>{assignment.title}</span>
                  <span className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditAssignmentDialogOpen(true); setEditItem(assignment); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ type: 'assignment', id: assignment.id })}><Trash className="h-4 w-4 text-red-500" /></Button>
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}</div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => navigate(`/courses/${assignment.course_id}`)}>Go to Course</Button>
                  <Button size="sm" variant="outline" onClick={() => handleViewSubmissions(assignment.id)}>View Submissions</Button>
                </div>
              </div>
            ))
          )}
        </div>
        <Dialog open={viewSubmissionsDialogOpen} onOpenChange={setViewSubmissionsDialogOpen}>
          <DialogContent className="max-w-2xl w-[90vw]">
            <DialogHeader><DialogTitle>Assignment Submissions</DialogTitle></DialogHeader>
            {submissions.length === 0 ? (
              <div>No submissions yet.</div>
            ) : (
              <ul className="space-y-4">
                {submissions.map(sub => (
                  <li key={sub.id} className="flex items-center gap-4 border-b pb-2">
                    <div className="flex-1">
                      <div className="font-medium">{sub.student?.name || sub.student_id}</div>
                      <div className="text-xs text-muted-foreground">{sub.student?.email}</div>
                      <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">Download PDF</a>
                      <div className="text-xs mt-1">Submitted: {new Date(sub.submitted_at).toLocaleString()}</div>
                    </div>
                    <input
                      type="text"
                      placeholder="Grade"
                      className="border rounded px-2 py-1 w-20"
                      value={grades[sub.id] || sub.grade || ''}
                      onChange={e => setGrades(g => ({ ...g, [sub.id]: e.target.value }))}
                      disabled={grading[sub.id]}
                    />
                    <textarea
                      placeholder="Remarks/Feedback"
                      className="border rounded px-2 py-1 w-40"
                      value={feedbacks[sub.id] || sub.feedback || ''}
                      onChange={e => setFeedbacks(f => ({ ...f, [sub.id]: e.target.value }))}
                      disabled={grading[sub.id]}
                    />
                    <Button size="sm" onClick={() => handleGrade(sub.id, sub.student_id)} disabled={grading[sub.id]}>Mark as Graded</Button>
                  </li>
                ))}
              </ul>
            )}
          </DialogContent>
        </Dialog>
        <h2 className="text-xl font-semibold mb-4">SCHEDULED LIVE CLASSES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isLoadingTeacherLiveClasses ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="rounded-xl p-6 bg-slate-100">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : teacherLiveClasses.length === 0 ? (
            <div className="col-span-full text-center p-8 bg-slate-50 rounded-xl">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No live classes scheduled</h3>
              <p className="text-muted-foreground mb-4">You have not scheduled any live classes yet.</p>
            </div>
          ) : (
            teacherLiveClasses.map((liveClass: any) => (
              <div key={liveClass.id} className="rounded-xl p-6 bg-white shadow flex flex-col gap-2">
                <div className="font-semibold text-lg mb-2 flex justify-between items-center">
                  <span>{liveClass.title}</span>
                  <span className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditLiveClassDialogOpen(true); setEditItem(liveClass); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ type: 'live_class', id: liveClass.id })}><Trash className="h-4 w-4 text-red-500" /></Button>
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">Start: {liveClass.start_time ? new Date(liveClass.start_time).toLocaleString() : 'N/A'}</div>
                <div className="text-sm text-gray-500 mb-2">Duration: {liveClass.duration} min</div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => navigate(`/courses/${liveClass.course_id}`)}>Go to Course</Button>
                </div>
              </div>
            ))
          )}
        </div>
        <Dialog open={editAssignmentDialogOpen} onOpenChange={setEditAssignmentDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Assignment</DialogTitle></DialogHeader>
            {editItem && (
              <>
                <Input placeholder="Assignment Title" value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} />
                <Input type="date" className="mt-2" value={editItem.due_date} onChange={e => setEditItem({ ...editItem, due_date: e.target.value })} />
                <Button className="mt-4 w-full" onClick={() => { if (editItem) updateAssignmentMutation.mutate(editItem); }}>Save</Button>
              </>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={editLiveClassDialogOpen} onOpenChange={setEditLiveClassDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Live Class</DialogTitle></DialogHeader>
            {editItem && (
              <>
                <Input placeholder="Title" value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} />
                <Input type="datetime-local" className="mt-2" value={editItem.start_time} onChange={e => setEditItem({ ...editItem, start_time: e.target.value })} />
                <Input type="number" className="mt-2" placeholder="Duration (minutes)" value={editItem.duration} onChange={e => setEditItem({ ...editItem, duration: e.target.value ? parseInt(e.target.value, 10) : null })} />
                <Input className="mt-2" placeholder="Meeting URL" value={editItem.meeting_url} onChange={e => setEditItem({ ...editItem, meeting_url: e.target.value })} />
                <Button className="mt-4 w-full" onClick={() => { if (editItem) updateLiveClassMutation.mutate(editItem); }}>Save</Button>
              </>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
            <p>Are you sure you want to delete this {deleteConfirm?.type === 'assignment' ? 'assignment' : 'live class'}?</p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => {
                if (deleteConfirm) {
                  if (deleteConfirm.type === 'assignment') {
                    deleteAssignmentMutation.mutate(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'live_class') {
                    deleteLiveClassMutation.mutate(deleteConfirm.id);
                  }
                  setDeleteConfirm(null);
                }
              }}>Delete</Button>
              <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.name || 'Student'}</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Input
              type="search"
              placeholder="Search courses..."
              className="w-full md:w-[300px] pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
          </div>
          <Button size="icon" variant="ghost" className="relative" onClick={handleViewNotifications}>
            <BellRing className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <h2 className="text-xl font-semibold mb-4">OVERVIEW</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard 
          icon={<BookOpen className="h-6 w-6 text-brightmind-blue" />}
          label="Courses in progress"
          value={isStudent ? numInProgress.toString() : (enrollments?.length?.toString() || "0")}
        />
        <StatCard 
          icon={<BookOpen className="h-6 w-6 text-brightmind-purple" />}
          label="Courses Completed"
          value={isStudent ? numCompleted.toString() : '0'}
        />
        <StatCard 
          icon={<Clock className="h-6 w-6 text-brightmind-blue" />}
          label="Hours Learning"
          value={formatHours(Number(studyStats.totalHours) || 0)}
        />
        <StatCard 
          icon={<Users className="h-6 w-6 text-brightmind-purple" />}
          label="Community score"
          value={studyStats.communityScore || 0}
        />
      </div>

      {/* Study Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
            <h3 className="text-xl font-semibold">STUDY STATISTICS</h3>
            <Tabs defaultValue="week">
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={studyStats.week}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar
                  dataKey="hours"
                  fill="#0EA5E9"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-6">PROGRESS</h3>
          <div className="flex justify-center">
            <div className="relative w-36 h-36 md:w-48 md:h-48">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="10"
                />
                {/* Progress circle - Courses */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#0EA5E9"
                  strokeWidth="10"
                  strokeDasharray="283"
                  strokeDashoffset={`$${283 - (averageProgress / 100) * 283}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-3xl font-bold">{averageProgress}%</div>
                <div className="text-sm text-gray-500">overall</div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-8">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-brightmind-blue mr-2"></div>
              <span className="text-sm">Courses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Courses */}
      {isStudent && totalCompleted > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">COMPLETED COURSES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {(enrollments || []).map((enrollment: any, idx: number) => {
              const course = enrollment.course;
              const progress = courseIdToProgress[course.id] || { percent: 0, completed: 0, total: 0 };
              if (progress.percent === 100) {
                return (
                  <CourseCardWithProgress
                    key={course.id}
                    course={course}
                    profile={profile}
                    user={user}
                    onClick={() => handleCourseClick(course.id)}
                  />
                );
              }
              return null;
            })}
          </div>
        </>
      )}

      {/* My Courses */}
      <h2 className="text-xl font-semibold mb-4">MY COURSES</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {renderCourses()}
      </div>
    </div>
  );
};

export default Dashboard;
