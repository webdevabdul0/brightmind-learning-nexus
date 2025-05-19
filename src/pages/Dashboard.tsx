import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, BookOpen, Clock, Users, Search, BellRing } from 'lucide-react';
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

// Utility function to generate random study data if none exists
const generateStudyStatistics = () => {
  return [
    { day: 'MON', hours: Math.floor(Math.random() * 5) + 1 },
    { day: 'TUE', hours: Math.floor(Math.random() * 5) + 1 },
    { day: 'WED', hours: Math.floor(Math.random() * 5) + 1 },
    { day: 'THU', hours: Math.floor(Math.random() * 5) + 1 },
    { day: 'FRI', hours: Math.floor(Math.random() * 5) + 1 },
    { day: 'SAT', hours: Math.floor(Math.random() * 3) + 0.5 },
    { day: 'SUN', hours: Math.floor(Math.random() * 4) + 0.5 },
  ];
};

const studyStatistics = generateStudyStatistics();

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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

  // Add this query to fetch completed lessons for the student
  const { data: completedLessonsCount = 0 } = useQuery({
    queryKey: ['completedLessons', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('id', { count: 'exact' })
        .eq('student_id', user.id)
        .eq('completed', true);
      if (error) return 0;
      return data.length;
    },
    enabled: !!user,
  });

  // Add this query to fetch total learning minutes from completed lessons
  const { data: totalLearningMinutes = 0 } = useQuery({
    queryKey: ['totalLearningMinutes', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      // Get all completed lesson ids for the user
      const { data: progress, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', user.id)
        .eq('completed', true);
      if (progressError || !progress) return 0;
      const lessonIds = progress.map((p: any) => p.lesson_id);
      if (!lessonIds.length) return 0;
      // Get the sum of durations for these lessons
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('duration')
        .in('id', lessonIds);
      if (lessonsError || !lessons) return 0;
      const totalMinutes = lessons.reduce((sum: number, l: any) => sum + (l.duration || 0), 0);
      return totalMinutes;
    },
    enabled: !!user,
  });

  // Calculate total learning hours
  const totalHours = studyStatistics.reduce((sum, day) => sum + day.hours, 0);
  
  // Format total hours
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleViewNotifications = () => {
    navigate('/notifications');
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
      .map((enrollment: any) => {
        const course = enrollment.course;
        
        // Generate a color based on the category or use default colors
        const colors = [
          'bg-brightmind-lightpurple text-brightmind-purple',
          'bg-brightmind-lightblue text-brightmind-blue',
          'bg-blue-100 text-blue-600',
          'bg-green-100 text-green-600',
          'bg-amber-100 text-amber-600',
          'bg-indigo-100 text-indigo-600'
        ];
        
        const colorIndex = Math.abs(course.title.charCodeAt(0) + course.title.charCodeAt(course.title.length - 1)) % colors.length;
        
        return (
          <CourseCard 
            key={course.id}
            id={course.id}
            title={course.title}
            instructor={course.instructor_name || 'Instructor'}
            color={colors[colorIndex]}
            progress={{ 
              completed: enrollment.progress || 0, 
              total: 100 
            }}
            onClick={() => handleCourseClick(course.id)}
          />
        );
      });
  };

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
            teacherCourses.map((course: any) => (
              <CourseCard 
                key={course.id}
                id={course.id}
                title={course.title}
                instructor={profile?.name || 'You'}
                color={'bg-brightmind-lightpurple text-brightmind-purple'}
                progress={{ completed: 0, total: 100 }}
                onClick={() => navigate(`/courses/${course.id}`)}
              />
            ))
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
              <div key={assignment.id} className="rounded-xl p-6 bg-white shadow">
                <div className="font-semibold text-lg mb-2">{assignment.title}</div>
                <div className="text-sm text-gray-500 mb-2">Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}</div>
                <Button size="sm" onClick={() => navigate(`/courses/${assignment.course_id}`)}>Go to Course</Button>
              </div>
            ))
          )}
        </div>
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
              <div key={liveClass.id} className="rounded-xl p-6 bg-white shadow">
                <div className="font-semibold text-lg mb-2">{liveClass.title}</div>
                <div className="text-sm text-gray-500 mb-2">Start: {liveClass.start_time ? new Date(liveClass.start_time).toLocaleString() : 'N/A'}</div>
                <div className="text-sm text-gray-500 mb-2">Duration: {liveClass.duration} min</div>
                <Button size="sm" onClick={() => navigate(`/courses/${liveClass.course_id}`)}>Go to Course</Button>
              </div>
            ))
          )}
        </div>
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
          value={enrollments?.length?.toString() || "0"}
        />
        <StatCard 
          icon={<BookOpen className="h-6 w-6 text-brightmind-purple" />}
          label="Lessons Completed"
          value={completedLessonsCount.toString()}
        />
        <StatCard 
          icon={<Clock className="h-6 w-6 text-brightmind-blue" />}
          label="Hours Learning"
          value={formatHours(totalLearningMinutes / 60)}
        />
        <StatCard 
          icon={<Users className="h-6 w-6 text-brightmind-purple" />}
          label="Community score"
          value="240"
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
              <ReBarChart data={studyStatistics}>
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
                
                {/* Progress circle - Courses (45%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#0EA5E9"
                  strokeWidth="10"
                  strokeDasharray="283"
                  strokeDashoffset="155"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                
                {/* Progress circle - Prototypes (80%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="#9b87f5"
                  strokeWidth="10"
                  strokeDasharray="220"
                  strokeDashoffset="44"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-3xl font-bold">45%</div>
                <div className="text-sm text-gray-500">overall</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center gap-8">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-brightmind-blue mr-2"></div>
              <span className="text-sm">Courses</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-brightmind-purple mr-2"></div>
              <span className="text-sm">Prototypes</span>
            </div>
          </div>
        </div>
      </div>

      {/* My Courses */}
      <h2 className="text-xl font-semibold mb-4">MY COURSES</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {renderCourses()}
      </div>
    </div>
  );
};

export default Dashboard;
