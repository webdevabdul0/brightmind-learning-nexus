
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  BookOpen, 
  Video, 
  FileText, 
  CheckCircle2, 
  Clock,
  Users,
  PlayCircle,
  Download,
  Calendar,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('content');
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch course details
  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;

      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:instructor_id(
            id,
            name,
            avatar_url
          )
        `)
        .eq('id', courseId)
        .single();

      if (error) {
        toast({
          title: "Error fetching course",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      return data;
    },
    enabled: !!courseId
  });

  // Fetch course modules and lessons
  const { data: modules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ['courseModules', courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('position');

      if (modulesError) {
        toast({
          title: "Error fetching modules",
          description: modulesError.message,
          variant: "destructive"
        });
        throw modulesError;
      }

      // Fetch lessons for each module
      const modulesWithLessons = await Promise.all(modulesData.map(async (module) => {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('course_lessons')
          .select('*')
          .eq('module_id', module.id)
          .order('position');

        if (lessonsError) {
          toast({
            title: "Error fetching lessons",
            description: lessonsError.message,
            variant: "destructive"
          });
          throw lessonsError;
        }

        return {
          ...module,
          lessons: lessonsData || []
        };
      }));

      return modulesWithLessons;
    },
    enabled: !!courseId
  });

  // Fetch course assignments
  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['courseAssignments', courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date');

      if (error) {
        toast({
          title: "Error fetching assignments",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      return data;
    },
    enabled: !!courseId
  });

  // Fetch user enrollment for this course
  const { data: enrollment, isLoading: isLoadingEnrollment } = useQuery({
    queryKey: ['enrollment', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user) return null;

      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        toast({
          title: "Error fetching enrollment",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      return data;
    },
    enabled: !!courseId && !!user
  });

  // Fetch lesson progress for this user
  const { data: lessonProgress = {}, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['lessonProgress', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user) return {};

      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('student_id', user.id);

      if (error) {
        toast({
          title: "Error fetching lesson progress",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      // Convert to map for easier lookup
      const progressMap: Record<string, boolean> = {};
      data.forEach(item => {
        progressMap[item.lesson_id] = item.completed;
      });
      
      return progressMap;
    },
    enabled: !!courseId && !!user
  });

  // Enroll in course mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !user) {
        throw new Error("Missing course ID or user");
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId,
          progress: 0
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', courseId, user?.id] });
      toast({
        title: "Enrolled successfully",
        description: "You are now enrolled in this course",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Enrollment failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mark lesson as completed mutation
  const markLessonCompletedMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) throw new Error("User not authenticated");

      // Check if progress already exists
      const { data: existingProgress } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', user.id)
        .single();

      if (existingProgress) {
        const { error } = await supabase
          .from('lesson_progress')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq('id', existingProgress.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lesson_progress')
          .insert({
            student_id: user.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString()
          });
          
        if (error) throw error;
      }

      // Update enrollment progress
      if (enrollment) {
        // Calculate new progress
        const totalLessons = modules.reduce(
          (total, module) => total + module.lessons.length, 0
        );
        
        // Add this lesson to progress count
        const completedLessons = Object.values(lessonProgress).filter(Boolean).length + 1;
        const newProgress = Math.round((completedLessons / totalLessons) * 100);
        
        const { error } = await supabase
          .from('enrollments')
          .update({ progress: newProgress })
          .eq('id', enrollment.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessonProgress', courseId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', courseId, user?.id] });
      toast({
        title: "Progress saved",
        description: "Lesson marked as completed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update progress",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handlePlayVideo = (lesson: any) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to watch course videos",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    if (!enrollment) {
      toast({
        title: "Enrollment required",
        description: "Please enroll in this course to watch videos",
        variant: "destructive"
      });
      return;
    }
    
    // Extract YouTube video ID
    let videoUrl = lesson.video_url || course?.video_url;
    if (!videoUrl) {
      toast({
        title: "Video not available",
        description: "This lesson doesn't have a video",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentVideoUrl(videoUrl);
    setCurrentLessonId(lesson.id);
    setVideoDialogOpen(true);
  };

  const handleCompleteLesson = (lessonId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to track progress",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    if (!enrollment) {
      toast({
        title: "Enrollment required",
        description: "Please enroll in this course to track progress",
        variant: "destructive"
      });
      return;
    }
    
    markLessonCompletedMutation.mutate(lessonId);
  };

  const handleEnroll = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to enroll in courses",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    enrollMutation.mutate();
  };

  const handleCloseVideo = () => {
    setVideoDialogOpen(false);
    // Mark the lesson as completed when closing the video
    if (currentLessonId) {
      handleCompleteLesson(currentLessonId);
    }
    setCurrentLessonId(null);
  };

  // Calculate course progress
  const calculateProgress = () => {
    if (!modules || !modules.length) return 0;
    
    const totalLessons = modules.reduce(
      (total, module) => total + module.lessons.length, 0
    );
    
    if (totalLessons === 0) return 0;
    
    const completedLessons = Object.values(lessonProgress).filter(Boolean).length;
    return Math.round((completedLessons / totalLessons) * 100);
  };

  // Transform YouTube URL to embed URL
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // Regular YouTube URL pattern
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[7].length === 11 ? match[7] : null;
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    
    return url; // Return original if not YouTube URL
  };

  // Loading states
  if (isLoadingCourse) {
    return (
      <div className="container mx-auto animate-fade-in p-8">
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="rounded-xl p-8 bg-slate-100 mb-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <p className="mb-6">The course you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
      </div>
    );
  }
  
  // Format currency
  const formatCurrency = (price: number | null) => {
    if (price === null) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Generate background color based on category
  const categoryColors: Record<string, string> = {
    'Mathematics': 'bg-brightmind-blue text-white',
    'Science': 'bg-brightmind-purple text-white',
    'Languages': 'bg-blue-600 text-white',
    'Humanities': 'bg-amber-600 text-white',
    'Computer Science': 'bg-indigo-600 text-white'
  };

  const bgColor = categoryColors[course.category] || 'bg-brightmind-blue text-white';

  return (
    <div className="container mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link to="/courses" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Link>
        
        <div className={`${bgColor} rounded-xl p-6 md:p-8`}>
          <div className="flex flex-col lg:flex-row justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">{course.title}</h1>
              {course.instructor && (
                <div className="flex items-center mb-4">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={course.instructor.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{course.instructor.name?.charAt(0) || 'I'}</AvatarFallback>
                  </Avatar>
                  <span>{course.instructor.name}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">{course.category}</Badge>
                {course.level && (
                  <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">{course.level}</Badge>
                )}
                {course.duration && (
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-4 w-4" />
                  <span>120 students</span>
                </div>
              </div>
              
              <p className="max-w-2xl">{course.description}</p>
              
              {!enrollment && (
                <div className="mt-6">
                  <Button 
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                    className="bg-white text-brightmind-blue hover:bg-white/90"
                  >
                    {enrollMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>Enroll Now - {formatCurrency(course.price)}</>
                    )}
                  </Button>
                </div>
              )}
            </div>
            {enrollment && (
              <div className="mt-6 lg:mt-0 lg:ml-6 lg:self-end">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg inline-block">
                  <div className="text-center mb-3">
                    <p className="font-medium">Course Progress</p>
                    <div className="text-3xl font-bold">{enrollment.progress || 0}%</div>
                  </div>
                  <Progress value={enrollment.progress || 0} className="w-40 h-2" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-8">
        <TabsList className="mb-8">
          <TabsTrigger value="content">Course Content</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="animate-fade-in">
          {isLoadingModules ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : modules.length > 0 ? (
            <div className="space-y-6">
              {modules.map((module, index) => (
                <div key={module.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-secondary p-4">
                    <h3 className="font-semibold text-lg">Module {index + 1}: {module.title}</h3>
                  </div>
                  
                  <div className="divide-y">
                    {module.lessons.map((lesson: any) => {
                      const isCompleted = lessonProgress[lesson.id] === true;
                      
                      return (
                        <div key={lesson.id} className="p-4 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {lesson.type === 'video' ? (
                                <Video className="w-5 h-5 mr-3 text-brightmind-blue" />
                              ) : (
                                <FileText className="w-5 h-5 mr-3 text-brightmind-purple" />
                              )}
                              <div>
                                <div className="flex items-center">
                                  <span className="font-medium">{lesson.title}</span>
                                  {isCompleted && (
                                    <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center mt-1">
                                  <Clock className="w-3 h-3 mr-1" />
                                  <span>{lesson.duration || 'N/A'} min</span>
                                </div>
                              </div>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePlayVideo(lesson)}
                              disabled={!enrollment && lesson.type === 'video'}
                            >
                              <PlayCircle className="mr-1 h-4 w-4" />
                              {isCompleted ? "Replay" : "Start"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No content available yet</h3>
              <p className="text-muted-foreground">
                The instructor is still preparing course content.
                {course.video_url && (
                  <span className="block mt-4">
                    In the meantime, you can watch the course introduction video.
                  </span>
                )}
              </p>
              {course.video_url && (
                <Button 
                  className="mt-4"
                  onClick={() => handlePlayVideo({ title: 'Course Introduction', video_url: course.video_url })}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Watch Introduction
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="assignments" className="animate-fade-in">
          {isLoadingAssignments ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-brightmind-purple" />
                    <div>
                      <div className="font-medium">{assignment.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="default"
                    size="sm"
                    disabled={!enrollment}
                  >
                    View Assignment
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No assignments available</h3>
              <p className="text-muted-foreground mb-4">
                There are currently no assignments for this course.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="resources" className="animate-fade-in">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-4">Course Materials</h3>
              <ul className="space-y-2">
                <li className="flex items-center justify-between p-2 hover:bg-muted/20 rounded">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-brightmind-blue" />
                    <span>Course Syllabus</span>
                  </div>
                  <Button variant="ghost" size="sm" disabled={!enrollment}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </li>
                <li className="flex items-center justify-between p-2 hover:bg-muted/20 rounded">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-brightmind-purple" />
                    <span>Practice Problems</span>
                  </div>
                  <Button variant="ghost" size="sm" disabled={!enrollment}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="discussions" className="animate-fade-in">
          <div className="p-8 text-center bg-muted/20 rounded-lg">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Join the Discussion</h3>
            <p className="text-muted-foreground mb-4">Connect with other students and ask questions about this course.</p>
            <Button disabled={!enrollment}>Start a Discussion</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={handleCloseVideo}>
        <DialogContent className="max-w-4xl w-[90vw] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Video Lesson</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full">
            <iframe
              src={getEmbedUrl(currentVideoUrl)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetail;
