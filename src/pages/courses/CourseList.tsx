import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
    } catch (error) {
      console.error("Error enrolling in course:", error);
    }
  };

  // Generate a course card with proper color
  const generateCourseCard = (course: any) => {
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
    
    const isEnrolled = enrolledCourseIds.includes(course.id);
    const enrollment = enrollments.find((e: any) => e.course_id === course.id);
    
    return (
      <div key={course.id} className="relative">
        <CourseCard
          id={course.id}
          title={course.title}
          instructor={course.instructor?.name || 'Instructor'}
          color={colors[colorIndex]}
          progress={{ 
            completed: isEnrolled && enrollment ? enrollment.progress : 0, 
            total: 100 
          }}
          onClick={() => handleCourseClick(course.id)}
          isEnrolled={isEnrolled}
          isLoadingEnrollments={isLoadingEnrollments}
          userRole={profile?.role}
          onEnroll={enrollInCourse}
        />
      </div>
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
          <TabsTrigger value="enrolled">Enrolled Courses</TabsTrigger>
          <TabsTrigger value="all">All Courses</TabsTrigger>
        </TabsList>
        <TabsContent value="enrolled" className="mt-6">
          {isLoadingEnrollments ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons(3)}
            </div>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map(course => generateCourseCard(course))}
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
        <TabsContent value="all" className="mt-6">
          {isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons(6)}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => generateCourseCard(course))}
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
