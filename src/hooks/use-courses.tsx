import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from '@/hooks/use-toast';

export function useCourses() {
  const { user, profile } = useAuth();
  
  // Fetch all courses for teachers/admins, only enrolled for students
  const {
    data: courses = [],
    isLoading: isLoadingCourses,
    error: coursesError
  } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      if (profile?.role === 'student') {
        // Students: fetch only their enrolled courses
        if (!user) return [];
        const { data, error } = await supabase
          .from('enrollments')
          .select('course:courses(*)')
          .eq('student_id', user.id);
        if (error) {
          toast({
            title: "Error fetching enrolled courses",
            description: error.message,
            variant: "destructive"
          });
          throw error;
        }
        console.log('Fetched enrollments for student:', data);
        return data.map((e: any) => e.course);
      } else {
        // Teachers/Admins: fetch all courses
        const { data, error } = await supabase
          .from('courses')
          .select(`*, instructor:instructor_id(name, avatar_url)`)
          .order('title');
        if (error) {
          toast({
            title: "Error fetching courses",
            description: error.message,
            variant: "destructive"
          });
          throw error;
        }
        console.log('Fetched all courses for teacher/admin:', data);
        return data;
      }
    },
    enabled: !!profile
  });
  
  // Fetch user enrollments if logged in
  const {
    data: enrollments = [],
    isLoading: isLoadingEnrollments
  } = useQuery({
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
      
      console.log('Fetched enrollments:', data);
      return data || [];
    },
    enabled: !!user
  });
  
  // Get enrolled course IDs
  const enrolledCourseIds = enrollments.map((enrollment: any) => enrollment.course_id);
  
  // Check if user is enrolled in a specific course
  const isEnrolled = (courseId: string) => {
    return enrolledCourseIds.includes(courseId);
  };
  
  // Get enrollment for a specific course
  const getEnrollment = (courseId: string) => {
    return enrollments.find((enrollment: any) => enrollment.course_id === courseId);
  };
  
  // For students, enrolledCourses = courses; for others, filter as before
  const enrolledCourses = profile?.role === 'student' ? courses : courses.filter(course => enrolledCourseIds.includes(course.id));
  
  return {
    courses,
    enrolledCourses,
    enrollments,
    isEnrolled,
    getEnrollment,
    isLoading: isLoadingCourses || isLoadingEnrollments,
    error: coursesError
  };
}
