import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Search, Filter, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import CourseCard from '@/components/dashboard/CourseCard';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { loadStripe } from '@stripe/stripe-js';

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

const CourseList = () => {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  // Fetch all categories
  const { data: categories = ['All'], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['courseCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('category')
        .order('category');

      if (error) {
        toast({
          title: "Error fetching categories",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      return ['All', ...uniqueCategories];
    }
  });

  // Fetch all courses
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:instructor_id(
            name
          )
        `)
        .order('title');

      if (error) {
        toast({
          title: "Error fetching courses",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      return data;
    }
  });

  // Fetch user enrollments
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['userEnrollments', user?.id],
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
    enabled: !!user
  });

  // Filter courses based on search query and selected category
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (course.instructor?.name && course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get enrolled course IDs
  const enrolledCourseIds = enrollments.map((enrollment: any) => enrollment.course_id);

  // Filter enrolled courses
  const enrolledCourses = courses.filter(course => 
    enrolledCourseIds.includes(course.id) &&
    (course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.instructor?.name && course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()))) &&
    (selectedCategory === 'All' || course.category === selectedCategory)
  );

  // --- NEW: Gather all visible course IDs for progress ---
  const visibleCourses = Array.from(new Set([
    ...filteredCourses.map((c: any) => c.id),
    ...enrolledCourses.map((c: any) => c.id),
  ]));

  // --- NEW: Fetch progress for all visible courses in parallel ---
  const courseProgressResults = useQueries({
    queries: visibleCourses.map((courseId: string) => ({
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
      enabled: !!user && !!courseId && profile?.role === 'student',
    })),
  }) as any;

  // --- NEW: Map courseId to progress for quick lookup ---
  const courseIdToProgress: Record<string, { percent: number; completed: number; total: number }> = {};
  visibleCourses.forEach((courseId: string, idx: number) => {
    courseIdToProgress[courseId] =
      courseProgressResults[idx] && courseProgressResults[idx].data !== undefined
        ? courseProgressResults[idx].data
        : { percent: 0, completed: 0, total: 0 };
  });

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  // Enroll in a course
  const enrollInCourse = async (courseId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to enroll in courses",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    try {
      // Check if already enrolled
      if (enrolledCourseIds.includes(courseId)) {
        toast({
          title: "Already enrolled",
          description: "You are already enrolled in this course",
        });
        return;
      }

      // Find the course object
      const course = courses.find((c: any) => c.id === courseId);
      if (!course) {
        toast({
          title: "Course not found",
          description: "Could not find the selected course.",
          variant: "destructive"
        });
        return;
      }

      if (course.price && course.price > 0) {
        // Paid course: initiate Stripe Checkout
        const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!stripeKey) {
          toast({
            title: "Stripe key missing",
            description: "Stripe publishable key is not set. Please contact support.",
            variant: "destructive"
          });
          return;
        }
        const stripe = await loadStripe(stripeKey);
        const response = await fetch('https://brighthubmind.netlify.app/.netlify/functions/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: course.id, price: course.price, userId: user.id })
        });
        let data: any = {};
        try {
          data = await response.json();
        } catch (e) {
          data = {};
        }
        if (response.ok && data.url) {
          window.location.href = data.url;
        } else {
          toast({
            title: "Payment failed",
            description: data.error || 'Could not initiate payment. Please try again later.',
            variant: "destructive"
          });
        }
        return;
      }

      // Free course: enroll directly
      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId,
          progress: 0
        });

      if (error) {
        toast({
          title: "Enrollment failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      toast({
        title: "Enrollment successful",
        description: "You have successfully enrolled in the course",
      });
      // Refresh enrollments data
      navigate(`/courses/${courseId}`);
    } catch (error: any) {
      console.error("Error enrolling in course:", error);
      toast({
        title: "Enrollment error",
        description: error.message || String(error),
        variant: "destructive"
      });
    }
  };

  // Child component to handle hook usage per card
  const CourseCardWithProgress = ({ course, isEnrolled, profile, onClick, isLoadingEnrollments, onEnroll }) => {
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
        instructor={course.instructor?.name || 'Instructor'}
        color={color}
        progress={{
          completed: isEnrolled && profile?.role === 'student' ? completed : 0,
          total: total
        }}
        onClick={onClick}
        isEnrolled={isEnrolled}
        isLoadingEnrollments={isLoadingEnrollments}
        userRole={profile?.role}
        onEnroll={onEnroll}
      />
    );
  };

  // Render skeleton loaders
  const renderSkeletons = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
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
  };

  return (
    <div className="container mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Course Catalog</h1>
          <p className="text-gray-600">Browse and discover courses to enhance your learning</p>
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
          <Button variant="outline" size="icon">
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tabs for categories */}
      <div className="mb-6 overflow-auto pb-2">
        <div className="flex space-x-2">
          {isLoadingCategories ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="w-20 h-10" />
            ))
          ) : (
            categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 whitespace-nowrap"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Tabs for enrolled vs all courses */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          {profile?.role !== 'teacher' && (
            <TabsTrigger value="enrolled">Enrolled Courses</TabsTrigger>
          )}
          <TabsTrigger value="all">All Courses</TabsTrigger>
        </TabsList>
        {profile?.role !== 'teacher' && (
          <TabsContent value="enrolled" className="mt-6">
            {isLoadingEnrollments ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderSkeletons(3)}
              </div>
            ) : enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map(course => (
                  <CourseCardWithProgress
                    key={course.id}
                    course={course}
                    isEnrolled={enrolledCourseIds.includes(course.id)}
                    profile={profile}
                    onClick={() => handleCourseClick(course.id)}
                    isLoadingEnrollments={isLoadingEnrollments}
                    onEnroll={enrollInCourse}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-muted/40 rounded-lg p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No enrolled courses found</h3>
                <p className="text-muted-foreground mb-4">You don't have any enrolled courses that match your search.</p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}>Clear filters</Button>
              </div>
            )}
          </TabsContent>
        )}
        <TabsContent value="all" className="mt-6">
          {isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons(6)}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <CourseCardWithProgress
                  key={course.id}
                  course={course}
                  isEnrolled={enrolledCourseIds.includes(course.id)}
                  profile={profile}
                  onClick={() => handleCourseClick(course.id)}
                  isLoadingEnrollments={isLoadingEnrollments}
                  onEnroll={enrollInCourse}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">We couldn't find any courses that match your search.</p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}>Clear filters</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseList;
