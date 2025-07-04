import { useState, useEffect, useRef } from 'react';
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
  Loader2,
  Pencil,
  Trash,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/providers/AuthProvider';
import { supabase, sendNotifications } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { AttendanceTab, StudentAttendanceView } from '@/components/AttendanceTab';
import { loadStripe } from '@stripe/stripe-js';

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, profile } = useAuth();
  const [currentTab, setCurrentTab] = useState('content');
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addModuleDialogOpen, setAddModuleDialogOpen] = useState(false);
  const [addLessonDialogOpen, setAddLessonDialogOpen] = useState(false);
  const [addAssignmentDialogOpen, setAddAssignmentDialogOpen] = useState(false);
  const [viewStudentsDialogOpen, setViewStudentsDialogOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState('video');
  const [newLessonModuleId, setNewLessonModuleId] = useState('');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('');
  const [textLessonDialogOpen, setTextLessonDialogOpen] = useState(false);
  const [currentTextLessonContent, setCurrentTextLessonContent] = useState('');
  const [newAssignmentQuestionFile, setNewAssignmentQuestionFile] = useState<File | null>(null);
  const [newAssignmentQuestionFileName, setNewAssignmentQuestionFileName] = useState('');
  const [editModuleDialogOpen, setEditModuleDialogOpen] = useState(false);
  const [editLessonDialogOpen, setEditLessonDialogOpen] = useState(false);
  const [editAssignmentDialogOpen, setEditAssignmentDialogOpen] = useState(false);
  const [editLiveClassDialogOpen, setEditLiveClassDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string, id: string } | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [newLessonPdfFile, setNewLessonPdfFile] = useState<File | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState('');
  const [liveClassTitle, setLiveClassTitle] = useState('');
  const [liveClassStartTime, setLiveClassStartTime] = useState('');
  const [liveClassDuration, setLiveClassDuration] = useState('');
  const [liveClassMeetingUrl, setLiveClassMeetingUrl] = useState('');
  const [students, setStudents] = useState([]);
  const [scheduleLiveClassDialogOpen, setScheduleLiveClassDialogOpen] = useState(false);
  const [discussionMessages, setDiscussionMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const discussionInputRef = useRef(null);
  const [currentPdfLessonId, setCurrentPdfLessonId] = useState<string | null>(null);
  const [discussionUserProfiles, setDiscussionUserProfiles] = useState<Record<string, { avatar_url: string | null, name: string | null }>>({});
  const [addResourceDialogOpen, setAddResourceDialogOpen] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceFile, setNewResourceFile] = useState<File | null>(null);
  const [resourceUploadLoading, setResourceUploadLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const resourceFileInputRef = useRef(null);
  const [deleteResourceId, setDeleteResourceId] = useState<string | null>(null);
  const [deleteResourceLoading, setDeleteResourceLoading] = useState(false);
  // Add state for withdraw dialog
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  // Add state for locked lesson modal
  const [lockedModalOpen, setLockedModalOpen] = useState(false);

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

  // Fetch assignments for the current course only
  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date');
      if (error) throw error;
      console.log('Fetched assignments for course', courseId, data);
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
        .maybeSingle();
      if (error) {
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

  // Fetch per-course progress for this user
  const { percent, completed, total } = useCourseProgress(courseId || '', user?.id);

  // Fetch completed lesson IDs for this course and user
  const { data: completedLessonIds = [] } = useQuery({
    queryKey: ['completedLessonIds', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user) return [];
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
        .eq('student_id', user.id)
        .eq('completed', true);
      const completedLessonIds = completedLessons ? completedLessons.map((l: any) => l.lesson_id) : [];
      // Return only those completed that are in this course
      return lessonIds.filter((id: any) => completedLessonIds.includes(id));
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
        // Recalculate progress using new logic
        const { data: allLessons } = await supabase
          .from('course_lessons')
          .select('id')
          .eq('course_id', courseId);
        const lessonIds = allLessons ? allLessons.map((l: any) => l.id) : [];
        // 2. Get all completed lessons for the student
        const { data: completedLessonsData } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('student_id', user.id)
          .eq('completed', true);
        const completedLessonIds = completedLessonsData ? completedLessonsData.map((l: any) => l.lesson_id) : [];
        // 3. Count how many course lessons are completed
        const completedLessonsCount = lessonIds.filter((id: any) => completedLessonIds.includes(id)).length;
        // Assignments
        const { data: allAssignments } = await supabase
          .from('assignments')
          .select('id')
          .eq('course_id', courseId);
        const assignmentIds = allAssignments ? allAssignments.map((a: any) => a.id) : [];
        const { data: completedAssignmentsData } = await supabase
          .from('assignment_submissions')
          .select('assignment_id')
          .eq('student_id', user.id)
          .eq('course_id', courseId)
          .eq('status', 'completed');
        const completedAssignmentIds = completedAssignmentsData ? completedAssignmentsData.map((a: any) => a.assignment_id) : [];
        const completedAssignmentsCount = assignmentIds.filter((id: any) => completedAssignmentIds.includes(id)).length;
        const totalLessons = lessonIds.length;
        const totalAssignments = assignmentIds.length;
        const totalItems = totalLessons + totalAssignments;
        const completedItems = completedLessonsCount + completedAssignmentsCount;
        const percent = totalItems === 0 ? 0 : Math.min(100, Math.round((completedItems / totalItems) * 100));
        // Upsert into course_progress
        await supabase
          .from('course_progress')
          .upsert({
            student_id: user.id,
            course_id: courseId,
            percent,
            completed: completedItems,
            total: totalItems,
            updated_at: new Date().toISOString()
          }, { onConflict: 'student_id,course_id' });
        const { error } = await supabase
          .from('enrollments')
          .update({ progress: percent })
          .eq('id', enrollment.id);
        if (error) throw error;
      }
      // --- STUDENT STATS LOGIC ---
      // 1. Get lesson duration
      const { data: lessonData } = await supabase
        .from('course_lessons')
        .select('duration')
        .eq('id', lessonId)
        .single();
      const durationMin = lessonData?.duration || 0;
      const durationHours = durationMin / 60;
      // 2. Get today's date (UTC)
      const today = new Date();
      const yyyy = today.getUTCFullYear();
      const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(today.getUTCDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      // 3. Fetch current stats for today
      const { data: statRow } = await supabase
        .from('student_stats')
        .select('*')
        .eq('student_id', user.id)
        .eq('date', dateStr)
        .maybeSingle();
      // Use correct types
      const prevHours = statRow && 'hours_studied' in statRow ? statRow.hours_studied : 0;
      const prevScore = statRow && 'community_score' in statRow ? statRow.community_score : 0;
      let newHours = prevHours + durationHours;
      let newScore = prevScore + 10; // +10 for lesson
      // If crossing 1 hour for the first time today, add +5 bonus
      if (prevHours < 1 && newHours >= 1) {
        newScore += 5;
      }
      const upsertObj = {
        student_id: user.id,
        date: dateStr,
        hours_studied: newHours,
        community_score: newScore,
        updated_at: new Date().toISOString()
      };
      await supabase
        .from('student_stats')
        .upsert(upsertObj, { onConflict: 'student_id,date' });
      // --- END STUDENT STATS LOGIC ---
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessonProgress', courseId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', courseId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['completedAssignments', courseId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['courseProgress', courseId, user?.id] });
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

  // Add mutation for teacher registration
  const registerAsTeacherMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !user) throw new Error('Missing course ID or user');
      const { error } = await supabase
        .from('courses')
        .update({ instructor_id: user.id })
        .eq('id', courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      toast({ title: 'Registered as teacher', description: 'You are now the instructor for this course.' });
    },
    onError: (error) => {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    }
  });

  // Add module mutation
  const addModuleMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !newModuleTitle) throw new Error('Missing data');
      const { error } = await supabase
        .from('course_modules')
        .insert({ course_id: courseId, title: newModuleTitle, position: modules.length + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      setAddModuleDialogOpen(false);
      setNewModuleTitle('');
      toast({ title: 'Module added' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add module', description: error.message, variant: 'destructive' });
    }
  });

  // Add lesson mutation
  const addLessonMutation = useMutation({
    mutationFn: async () => {
      if (!newLessonModuleId || !newLessonTitle) throw new Error('Missing data');
      let pdfUrl = null;
      if (newLessonType === 'pdf') {
        if (!newLessonPdfFile) throw new Error('Please select a PDF file');
        const filePath = `lesson-pdfs/${Date.now()}-${newLessonPdfFile.name}`;
        const { error: uploadError } = await supabase.storage.from('lesson-pdfs').upload(filePath, newLessonPdfFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('lesson-pdfs').getPublicUrl(filePath);
        pdfUrl = urlData?.publicUrl || '';
      }
      const insertData = {
        module_id: newLessonModuleId,
        course_id: courseId,
        title: newLessonTitle,
        type: newLessonType,
        video_url: newLessonType === 'video' ? newLessonVideoUrl : null,
        content: newLessonType === 'text' ? newLessonContent : null,
        pdf_url: newLessonType === 'pdf' ? pdfUrl : null,
        duration: newLessonDuration ? parseInt(newLessonDuration, 10) : null,
        position: modules.find(m => m.id === newLessonModuleId)?.lessons.length + 1 || 1
      };
      const { error } = await supabase
        .from('course_lessons')
        .insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      setAddLessonDialogOpen(false);
      setNewLessonTitle('');
      setNewLessonType('video');
      setNewLessonModuleId('');
      setNewLessonVideoUrl('');
      setNewLessonContent('');
      setNewLessonDuration('');
      setNewLessonPdfFile(null);
      toast({ title: 'Lesson added' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add lesson', description: error.message, variant: 'destructive' });
    }
  });

  // Add assignment mutation
  const addAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !newAssignmentTitle || !newAssignmentDueDate) throw new Error('Missing data');
      let questionPdfUrl = '';
      if (newAssignmentQuestionFile) {
        const filePath = `course-${courseId}/assignment-question-${Date.now()}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('assignments').upload(filePath, newAssignmentQuestionFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(filePath);
        questionPdfUrl = urlData?.publicUrl || '';
      }
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          course_id: courseId,
          title: newAssignmentTitle,
          due_date: newAssignmentDueDate,
          question_pdf_url: questionPdfUrl
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (assignment) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      setAddAssignmentDialogOpen(false);
      setNewAssignmentTitle('');
      setNewAssignmentDueDate('');
      setNewAssignmentQuestionFile(null);
      setNewAssignmentQuestionFileName('');
      toast({ title: 'Assignment added' });
      // Notify all enrolled students
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('course_id', courseId);
      if (enrollments && enrollments.length > 0) {
        const studentIds = enrollments.map((e: any) => e.student_id);
        await sendNotifications(
          studentIds,
          'New Assignment',
          `A new assignment "${assignment.title}" has been added to your course.`,
          'assignment',
          `/courses/${courseId}`
        );
      }
    },
    onError: (error) => {
      toast({ title: 'Failed to add assignment', description: error.message, variant: 'destructive' });
    }
  });

  // Schedule live class mutation
  const scheduleLiveClassMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !user || !liveClassTitle || !liveClassStartTime || !liveClassDuration || !liveClassMeetingUrl) throw new Error('Missing data');
      const { data, error } = await supabase
        .from('live_classes')
        .insert({
          course_id: courseId,
          instructor_id: user.id,
          title: liveClassTitle,
          start_time: liveClassStartTime,
          duration: parseInt(liveClassDuration, 10),
          meeting_url: liveClassMeetingUrl
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (liveClass) => {
      setScheduleLiveClassDialogOpen(false);
      setLiveClassTitle('');
      setLiveClassStartTime('');
      setLiveClassDuration('');
      setLiveClassMeetingUrl('');
      toast({ title: 'Live class scheduled' });
      // Notify all enrolled students
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('course_id', courseId);
      if (enrollments && enrollments.length > 0) {
        const studentIds = enrollments.map((e: any) => e.student_id);
        await sendNotifications(
          studentIds,
          'New Live Class',
          `A new live class "${liveClass.title}" has been scheduled for your course.`,
          'live_class',
          `/courses/${courseId}`
        );
      }
    },
    onError: (error) => {
      toast({ title: 'Failed to schedule live class', description: error.message, variant: 'destructive' });
    }
  });

  // Fetch students for this course
  const fetchStudents = async () => {
    if (!courseId) return;
    const { data, error } = await supabase
      .from('enrollments')
      .select('student:student_id(id, name, email)')
      .eq('course_id', courseId);
    if (!error) setStudents(data.map(e => e.student));
  };

  const handleStartLesson = (lesson: any) => {
    if (lesson.type === 'video') {
      handlePlayVideo(lesson);
    } else if (lesson.type === 'text') {
      setCurrentTextLessonContent(lesson.content || '');
      setCurrentLessonId(lesson.id);
      setTextLessonDialogOpen(true);
      // Optionally mark as completed immediately for text lessons
      handleCompleteLesson(lesson.id);
    } else if (lesson.type === 'pdf') {
      setCurrentPdfUrl(lesson.pdf_url || '');
      setCurrentPdfLessonId(lesson.id);
      setPdfDialogOpen(true);
    }
  };

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

  const handleEnroll = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to enroll in courses",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    if (!course) {
      toast({
        title: "Course not found",
        description: "Could not find the selected course.",
        variant: "destructive"
      });
      return;
    }
    // Always enroll, regardless of price
    enrollMutation.mutate();
  };

  const handleBuyPremium = async () => {
    if (!user || !course) return;
    try {
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
    } catch (error: any) {
      toast({
        title: "Payment error",
        description: error.message || String(error),
        variant: "destructive"
      });
    }
  };

  const handleCloseVideo = () => {
    setVideoDialogOpen(false);
    // Mark the lesson as completed when closing the video
    if (currentLessonId) {
      handleCompleteLesson(currentLessonId);
    }
    setCurrentLessonId(null);
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

  // 1. Add update and delete mutations for each type
  const updateLessonMutation = useMutation({
    mutationFn: async (lesson) => {
      const { error } = await supabase.from('course_lessons').update(lesson).eq('id', lesson.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      setEditLessonDialogOpen(false);
      setEditItem(null);
      toast({ title: 'Lesson updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update lesson', description: error.message, variant: 'destructive' });
    }
  });
  const deleteLessonMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('course_lessons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      setDeleteConfirm(null);
      toast({ title: 'Lesson deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete lesson', description: error.message, variant: 'destructive' });
    }
  });

  // Assignment update mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async (assignment) => {
      const { error } = await supabase.from('assignments').update(assignment).eq('id', assignment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      setEditAssignmentDialogOpen(false);
      setEditItem(null);
      toast({ title: 'Assignment updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update assignment', description: error.message, variant: 'destructive' });
    }
  });

  // Live class update mutation
  const updateLiveClassMutation = useMutation({
    mutationFn: async (liveClass) => {
      const { error } = await supabase.from('live_classes').update(liveClass).eq('id', liveClass.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveClasses', courseId] });
      setEditLiveClassDialogOpen(false);
      setEditItem(null);
      toast({ title: 'Live class updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update live class', description: error.message, variant: 'destructive' });
    }
  });

  // Module update and delete mutations
  const updateModuleMutation = useMutation({
    mutationFn: async (module) => {
      const { error } = await supabase.from('course_modules').update(module).eq('id', module.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      setEditModuleDialogOpen(false);
      setEditItem(null);
      toast({ title: 'Module updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update module', description: error.message, variant: 'destructive' });
    }
  });
  const deleteModuleMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('course_modules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      setDeleteConfirm(null);
      toast({ title: 'Module deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete module', description: error.message, variant: 'destructive' });
    }
  });
  // Assignment delete mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      setDeleteConfirm(null);
      toast({ title: 'Assignment deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete assignment', description: error.message, variant: 'destructive' });
    }
  });
  // Live class delete mutation
  const deleteLiveClassMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('live_classes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveClasses', courseId] });
      setDeleteConfirm(null);
      toast({ title: 'Live class deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete live class', description: error.message, variant: 'destructive' });
    }
  });

  // Fetch discussion messages for this course
  useEffect(() => {
    if (!courseId) return;
    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('course_discussions')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });
      if (!error) {
        setDiscussionMessages(data || []);
        // Fetch all unique user profiles for discussion messages
        const userIds = Array.from(new Set((data || []).map((msg: any) => msg.user_id)));
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, avatar_url, name')
            .in('id', userIds);
          const profileMap: Record<string, { avatar_url: string | null, name: string | null }> = {};
          (profilesData || []).forEach((profile: any) => {
            profileMap[profile.id] = { avatar_url: profile.avatar_url, name: profile.name };
          });
          setDiscussionUserProfiles(profileMap);
        } else {
          setDiscussionUserProfiles({});
        }
      }
      setLoadingMessages(false);
    };
    fetchMessages();
  }, [courseId]);

  // Post a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    const { error } = await supabase
      .from('course_discussions')
      .insert({
        course_id: courseId,
        user_id: user.id,
        user_name: profile?.name || user.email,
        message: newMessage.trim(),
      });
    if (!error) {
      setNewMessage('');
      if (discussionInputRef.current) discussionInputRef.current.focus();
      // Refetch messages
      const { data } = await supabase
        .from('course_discussions')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });
      setDiscussionMessages(data || []);
    }
  };

  // Add this function inside the CourseDetail component
  const handleAddResource = async () => {
    if (!newResourceTitle || !newResourceFile || !courseId || !user) return;
    setResourceUploadLoading(true);
    try {
      // Upload PDF to Supabase Storage
      const filePath = `course-${courseId}/${Date.now()}-${newResourceFile.name}`;
      const { error: uploadError } = await supabase.storage.from('course-resources').upload(filePath, newResourceFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('course-resources').getPublicUrl(filePath);
      const fileUrl = urlData?.publicUrl || '';
      // Insert metadata into course_resources table
      const { error: insertError } = await supabase.from('course_resources').insert({
        course_id: courseId,
        title: newResourceTitle,
        file_url: fileUrl,
        uploaded_by: user.id
      });
      if (insertError) throw insertError;
      // Refresh resources list
      fetchResources();
      setAddResourceDialogOpen(false);
      setNewResourceTitle('');
      setNewResourceFile(null);
      if (resourceFileInputRef.current) resourceFileInputRef.current.value = '';
      toast({ title: 'Resource added', description: 'PDF uploaded successfully.' });
    } catch (err: any) {
      toast({ title: 'Error adding resource', description: err.message, variant: 'destructive' });
    } finally {
      setResourceUploadLoading(false);
    }
  };

  // Fetch resources for this course
  const fetchResources = async () => {
    if (!courseId) return;
    const { data, error } = await supabase
      .from('course_resources')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    if (!error) setResources(data || []);
  };

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Add this function to handle resource deletion
  const handleDeleteResource = async () => {
    if (!deleteResourceId || !courseId) return;
    setDeleteResourceLoading(true);
    try {
      // Find the resource to get the file path
      const resource = resources.find((r: any) => r.id === deleteResourceId);
      if (!resource) throw new Error('Resource not found');
      // Extract file path from file_url
      const url = new URL(resource.file_url);
      const pathParts = url.pathname.split('/');
      // Find the index of the bucket name
      const bucketIndex = pathParts.findIndex(p => p === 'course-resources');
      const filePath = pathParts.slice(bucketIndex + 1).join('/');
      // Delete from storage
      const { error: storageError } = await supabase.storage.from('course-resources').remove([filePath]);
      if (storageError) throw storageError;
      // Delete from table
      const { error: dbError } = await supabase.from('course_resources').delete().eq('id', deleteResourceId);
      if (dbError) throw dbError;
      setDeleteResourceId(null);
      fetchResources();
      toast({ title: 'Resource deleted' });
    } catch (err: any) {
      toast({ title: 'Error deleting resource', description: err.message, variant: 'destructive' });
    } finally {
      setDeleteResourceLoading(false);
    }
  };

  // Withdraw handler
  const handleWithdraw = async () => {
    if (!user || !courseId) return;
    setWithdrawing(true);
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', user.id)
        .eq('course_id', courseId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['enrollment', courseId, user?.id] });
      toast({ title: 'Withdrawn', description: 'You have withdrawn from this course.' });
      setWithdrawDialogOpen(false);
      // Optionally, redirect or update UI
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setWithdrawing(false);
    }
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
    if (price === null || price === 0) return 'Free';
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

  // Pricing/features model for non-enrolled students
  const renderPricingModel = () => (
    <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-8 my-8 max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">Unlock Premium Access</h2>
      <p className="mb-6 text-muted-foreground text-center max-w-lg">
        Enroll in this course to access all premium features and maximize your learning experience!
      </p>
      
        <div className="bg-brightmind-blue text-white rounded-lg p-4 flex flex-col items-center">
          <h3 className="font-semibold text-lg mb-2">Premium</h3>
          <ul className="text-sm space-y-2">
            <li>✔️ All course content & lessons</li>
            <li>✔️ Assignments</li>
            <li>✔️ Quizzes</li>
            <li>✔️ Live Classes</li>
            <li>✔️ Resources & Downloads</li>
            <li>✔️ Discussions</li>
            <li>✔️ Attendance Tracking</li>
          </ul>
        </div>
      
      <Button 
        className="mt-2 px-8 py-3 text-lg font-semibold"
        onClick={isPaidCourse ? handleBuyPremium : handleEnroll}
        disabled={enrollMutation.isPending}
      >
        {enrollMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isPaidCourse ? 'Processing...' : 'Processing...'}
          </>
        ) : (
          <>{isPaidCourse ? `Buy ${formatCurrency(course.price)}` : `Enroll Now - ${formatCurrency(course.price)}`}</>
        )}
      </Button>
    </div>
  );

  // Helper to check if course is paid
  const isPaidCourse = course?.price && course.price > 0;
  // Helper to check if student has premium access (assume 'is_paid' or 'premium' flag in enrollment)
  const hasPremium = !!enrollment && (enrollment.is_paid || enrollment.premium);

  // Banner for limited access in paid courses
  const renderLimitedAccessBanner = () => (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded mb-6 flex flex-col items-center">
      <div className="font-semibold mb-2">This course has limited access</div>
      <div className="mb-2 text-center">You are enrolled, but premium features are locked. Buy premium to get full access to assignments, quizzes, live classes, resources, discussions, and attendance.</div>
      <Button className="mt-2" onClick={handleBuyPremium} disabled={enrollMutation.isPending}>
        {enrollMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Buy Premium'}
      </Button>
    </div>
  );

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
                
              </div>
              
              <p className="max-w-2xl">{course.description}</p>
              
              {/* Only show enroll/buy button if not enrolled and user is a student */}
              {profile?.role === 'student' && !enrollment && (
                <div className="mt-6">
                  <Button 
                    onClick={isPaidCourse ? handleBuyPremium : handleEnroll}
                    disabled={enrollMutation.isPending}
                    className="bg-white text-brightmind-blue hover:bg-white/90"
                  >
                    {enrollMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isPaidCourse ? 'Processing...' : 'Enrolling...'}
                      </>
                    ) : (
                      <>{isPaidCourse ? `Buy ${formatCurrency(course.price)}` : `Enroll Now - ${formatCurrency(course.price)}`}</>
                    )}
                  </Button>
                </div>
              )}
              {/* Show Register as Teacher button if teacher and no instructor */}
              {profile?.role === 'teacher' && !course.instructor_id && (
                <div className="mt-6">
                  <Button 
                    onClick={() => registerAsTeacherMutation.mutate()}
                    disabled={registerAsTeacherMutation.isPending}
                    className="bg-brightmind-blue text-white hover:bg-brightmind-blue/90"
                  >
                    {registerAsTeacherMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>Register as a Teacher</>
                    )}
                  </Button>
                </div>
              )}
              {/* After registration, show management UI for the instructor */}
              {profile?.role === 'teacher' && course.instructor_id === user?.id && (
                <div className="mt-6 space-y-2">
                  <Button variant="secondary" className="w-full" onClick={() => setAddModuleDialogOpen(true)}>Add Module</Button>
                  <Button variant="secondary" className="w-full" onClick={() => setAddLessonDialogOpen(true)}>Add Lesson</Button>
                  <Button variant="secondary" className="w-full" onClick={() => setAddAssignmentDialogOpen(true)}>Add Assignment</Button>
                  <Button variant="secondary" className="w-full" onClick={() => { fetchStudents(); setViewStudentsDialogOpen(true); }}>View Enrolled Students</Button>
                  <Button variant="secondary" className="w-full" onClick={() => setScheduleLiveClassDialogOpen(true)}>Schedule Live Class</Button>
                </div>
              )}
            </div>
            {/* Only show progress for students */}
            {enrollment && profile?.role === 'student' && (
              <div className="mt-6 lg:mt-0 lg:ml-6 lg:self-end">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg inline-block">
                  <div className="text-center mb-3">
                    <p className="font-medium">Course Progress</p>
                    <div className="text-3xl font-bold">{percent}%</div>
                    <div className="text-xs text-gray-500">{completed} of {total} completed</div>
                  </div>
                  <Progress value={percent} className="w-40 h-2" />
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
          {(profile?.role === 'teacher' && course.instructor_id === user?.id) || (profile?.role === 'student' && enrollment) ? (
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          ) : null}
        </TabsList>
        
        <TabsContent value="content" className="animate-fade-in">
          {profile?.role === 'student' && enrollment && isPaidCourse && !hasPremium ? (
            <>
              {renderLimitedAccessBanner()}
              {/* Show all lessons in first module, lock the rest */}
              <div className="space-y-6">
                {modules.map((module, index) => (
                  <div key={module.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-secondary p-4">
                      <h3 className="font-semibold text-lg">Module {index + 1}: {module.title}</h3>
                    </div>
                    <div className="divide-y">
                      {module.lessons.map((lesson: any) => {
                        const isCompleted = completedLessonIds.includes(lesson.id);
                        const isUnlocked = index === 0; // Only first module is unlocked
                        return (
                          <div
                            key={lesson.id}
                            className={`p-4 transition-colors flex items-center justify-between ${isUnlocked ? 'hover:bg-muted/20 cursor-pointer' : 'bg-gray-100 opacity-60 cursor-not-allowed'}`}
                            onClick={isUnlocked ? () => handleStartLesson(lesson) : () => setLockedModalOpen(true)}
                          >
                            <div className="flex items-center">
                              {lesson.type === 'video' ? (
                                <Video className="w-5 h-5 mr-3 text-brightmind-blue" />
                              ) : lesson.type === 'pdf' ? (
                                <FileText className="w-5 h-5 mr-3 text-brightmind-purple" />
                              ) : (
                                <FileText className="w-5 h-5 mr-3 text-brightmind-purple" />
                              )}
                              <div>
                                <div className="flex items-center">
                                  <span className="font-medium">{lesson.title}</span>
                                  {isCompleted && isUnlocked && (
                                    <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                                  )}
                                  {!isUnlocked && (
                                    <span className="ml-2 text-yellow-600 flex items-center"><Lock className="w-4 h-4 mr-1" /> Premium</span>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center mt-1">
                                  <Clock className="w-3 h-3 mr-1" />
                                  <span>{lesson.duration || 'N/A'} min</span>
                                </div>
                                {lesson.type === 'text' && lesson.content && isUnlocked && (
                                  <div className="prose max-w-none mt-2" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                                )}
                              </div>
                            </div>
                            {lesson.type === 'pdf' && lesson.pdf_url && profile?.role === 'student' && isUnlocked && (
                              <Button size="sm" className="ml-4" onClick={e => { e.stopPropagation(); setCurrentPdfUrl(lesson.pdf_url); setCurrentPdfLessonId(lesson.id); setPdfDialogOpen(true); }}>
                                View PDF
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {/* Locked lesson modal */}
              <Dialog open={lockedModalOpen} onOpenChange={setLockedModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Premium Content</DialogTitle>
                  </DialogHeader>
                  <p>This lesson is part of the premium course. Buy premium to unlock all modules and lessons!</p>
                  <Button className="mt-4" onClick={handleBuyPremium}>Buy Premium</Button>
                </DialogContent>
              </Dialog>
            </>
          ) : profile?.role === 'student' && !enrollment ? (
            renderPricingModel()
          ) : isLoadingModules ? (
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
                      const isCompleted = completedLessonIds.includes(lesson.id);
                      
                      return (
                        <div
                          key={lesson.id}
                          className={`p-4 hover:bg-muted/20 transition-colors ${profile?.role === 'student' ? 'cursor-pointer' : ''}`}
                          onClick={profile?.role === 'student' ? () => handleStartLesson(lesson) : undefined}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {lesson.type === 'video' ? (
                                <Video className="w-5 h-5 mr-3 text-brightmind-blue" />
                              ) : lesson.type === 'pdf' ? (
                                <FileText className="w-5 h-5 mr-3 text-brightmind-purple" />
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
                                {lesson.type === 'text' && lesson.content && (
                                  <div className="prose max-w-none mt-2" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                                )}
                              </div>
                            </div>
                            
                            {profile?.role === 'teacher' && user?.id === course.instructor_id && (
                              <div className="flex gap-2 ml-4">
                                <Button variant="ghost" size="icon" onClick={() => { setEditLessonDialogOpen(true); setEditItem(lesson); }}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ type: 'lesson', id: lesson.id })}><Trash className="h-4 w-4 text-red-500" /></Button>
                              </div>
                            )}
                            {lesson.type === 'pdf' && lesson.pdf_url && profile?.role === 'student' && (
                              <Button size="sm" className="ml-4" onClick={e => { e.stopPropagation(); setCurrentPdfUrl(lesson.pdf_url); setCurrentPdfLessonId(lesson.id); setPdfDialogOpen(true); }}>
                                View PDF
                              </Button>
                            )}
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
          {profile?.role === 'student' && enrollment && isPaidCourse && !hasPremium ? (
            <>{renderLimitedAccessBanner()}</>
          ) : profile?.role === 'student' && !enrollment ? (
            renderPricingModel()
          ) : isLoadingAssignments ? (
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
                  {profile?.role === 'teacher' && user?.id === course.instructor_id && (
                    <div className="flex gap-2 ml-4">
                      <Button variant="ghost" size="icon" onClick={() => { setEditAssignmentDialogOpen(true); setEditItem(assignment); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ type: 'assignment', id: assignment.id })}><Trash className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  )}
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
          {profile?.role === 'student' && enrollment && isPaidCourse && !hasPremium ? (
            <>{renderLimitedAccessBanner()}</>
          ) : profile?.role === 'student' && !enrollment ? (
            renderPricingModel()
          ) : (
            <div className="space-y-4">
              {profile?.role === 'teacher' && course.instructor_id === user?.id && (
                <>
                  <Button className="mb-4" onClick={() => setAddResourceDialogOpen(true)}>
                    Add Resource
                  </Button>
                  <Dialog open={addResourceDialogOpen} onOpenChange={setAddResourceDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Resource</DialogTitle>
                      </DialogHeader>
                      {/* Form for uploading PDF and entering title */}
                      <Input
                        className="mb-2"
                        placeholder="Resource Title"
                        value={newResourceTitle}
                        onChange={e => setNewResourceTitle(e.target.value)}
                      />
                      <Input
                        className="mb-2"
                        type="file"
                        accept="application/pdf"
                        ref={resourceFileInputRef}
                        onChange={e => setNewResourceFile(e.target.files?.[0] || null)}
                      />
                      {newResourceFile && <div className="text-xs mb-2">Selected: {newResourceFile.name}</div>}
                      <Button
                        className="w-full"
                        onClick={handleAddResource}
                        disabled={resourceUploadLoading || !newResourceTitle || !newResourceFile}
                      >
                        {resourceUploadLoading ? 'Uploading...' : 'Add Resource'}
                      </Button>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-4">Course Materials</h3>
                <ul className="space-y-2">
                  {resources.length === 0 ? (
                    <li className="flex items-center justify-between p-2 hover:bg-muted/20 rounded">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-brightmind-blue" />
                        <span>No materials uploaded yet.</span>
                      </div>
                    </li>
                  ) : (
                    resources.map(resource => (
                      <li key={resource.id} className="flex items-center justify-between p-2 hover:bg-muted/20 rounded">
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-2 text-brightmind-blue" />
                          <span>{resource.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={resource.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline text-sm"
                          >
                            Download
                          </a>
                          {profile?.role === 'teacher' && course.instructor_id === user?.id && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteResourceId(resource.id)}
                              disabled={deleteResourceLoading}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="discussions" className="animate-fade-in">
          {profile?.role === 'student' && enrollment && isPaidCourse && !hasPremium ? (
            <>{renderLimitedAccessBanner()}</>
          ) : profile?.role === 'student' && !enrollment ? (
            renderPricingModel()
          ) : (
            <div className="p-4 md:p-8 bg-muted/20 rounded-lg max-w-2xl mx-auto">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Users className="h-6 w-6 text-muted-foreground" />
                Course Discussions
              </h3>
              {loadingMessages ? (
                <div className="text-center text-muted-foreground">Loading messages...</div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
                  {discussionMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground">No messages yet. Start the conversation!</div>
                  ) : (
                    discussionMessages.map(msg => {
                      const profile = discussionUserProfiles[msg.user_id] || {};
                      const avatarUrl = profile.avatar_url || "/placeholder.svg";
                      const name = profile.name || msg.user_name || "User";
                      const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                      return (
                        <div key={msg.id} className="bg-white/80 border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={avatarUrl} alt={name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-brightmind-blue">{name}</div>
                            <div className="text-base mt-1">{msg.message}</div>
                            <div className="text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              {(enrollment || (profile?.role === 'teacher' && course.instructor_id === user?.id)) ? (
                <div className="flex gap-2 mt-2">
                  <Input
                    ref={discussionInputRef}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>Send</Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground mt-4">Enroll in this course to join the discussion.</div>
              )}
            </div>
          )}
        </TabsContent>

        {profile?.role === 'teacher' && course.instructor_id === user?.id && (
          <TabsContent value="attendance" className="animate-fade-in">
            <AttendanceTab courseId={courseId} />
          </TabsContent>
        )}
        {profile?.role === 'student' && enrollment && (
          <TabsContent value="attendance" className="animate-fade-in">
            <StudentAttendanceView courseId={courseId} userId={user?.id} />
          </TabsContent>
        )}
        {profile?.role === 'student' && enrollment && isPaidCourse && !hasPremium && (
          <TabsContent value="attendance" className="animate-fade-in">
            {renderLimitedAccessBanner()}
          </TabsContent>
        )}
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

      {/* Add Module Dialog */}
      <Dialog open={addModuleDialogOpen} onOpenChange={setAddModuleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Module</DialogTitle></DialogHeader>
          <Input placeholder="Module Title" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} />
          <Button className="mt-4 w-full" onClick={() => addModuleMutation.mutate()} disabled={addModuleMutation.isPending}>Add Module</Button>
        </DialogContent>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={addLessonDialogOpen} onOpenChange={setAddLessonDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Lesson</DialogTitle></DialogHeader>
          <select className="w-full mb-2" value={newLessonModuleId} onChange={e => setNewLessonModuleId(e.target.value)}>
            <option value="">Select Module</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
          <Input placeholder="Lesson Title" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} />
          <select className="w-full mt-2" value={newLessonType} onChange={e => setNewLessonType(e.target.value)}>
            <option value="video">Video</option>
            <option value="text">Text</option>
            <option value="pdf">PDF</option>
          </select>
          {newLessonType === 'video' && (
            <Input className="mt-2" placeholder="YouTube Video URL" value={newLessonVideoUrl} onChange={e => setNewLessonVideoUrl(e.target.value)} />
          )}
          {newLessonType === 'text' && (
            <div className="mt-2">
              <ReactQuill value={newLessonContent} onChange={setNewLessonContent} theme="snow"
                style={{ maxHeight: 600, overflowY: 'auto' }}
              />
            </div>
          )}
          {newLessonType === 'pdf' && (
            <div className="mt-2">
              <Input type="file" accept="application/pdf" onChange={e => setNewLessonPdfFile(e.target.files?.[0] || null)} />
              {newLessonPdfFile && <div className="text-xs mt-1">Selected: {newLessonPdfFile.name}</div>}
            </div>
          )}
          <Input className="mt-2" type="number" min="1" placeholder="Duration (minutes)" value={newLessonDuration} onChange={e => setNewLessonDuration(e.target.value)} />
          <Button className="mt-4 w-full" onClick={() => addLessonMutation.mutate()} disabled={addLessonMutation.isPending}>Add Lesson</Button>
        </DialogContent>
      </Dialog>

      {/* Add Assignment Dialog */}
      <Dialog open={addAssignmentDialogOpen} onOpenChange={setAddAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Assignment</DialogTitle></DialogHeader>
          <Input placeholder="Assignment Title" value={newAssignmentTitle} onChange={e => setNewAssignmentTitle(e.target.value)} />
          <Input type="date" className="mt-2" value={newAssignmentDueDate} onChange={e => setNewAssignmentDueDate(e.target.value)} />
          <div className="mt-2">
            <label className="block text-sm font-medium mb-1">Upload Question PDF</label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={e => {
                const file = e.target.files?.[0] || null;
                setNewAssignmentQuestionFile(file);
                setNewAssignmentQuestionFileName(file ? file.name : '');
              }}
            />
            {newAssignmentQuestionFileName && (
              <div className="text-xs text-muted-foreground mt-1">Selected: {newAssignmentQuestionFileName}</div>
            )}
          </div>
          <Button className="mt-4 w-full" onClick={() => addAssignmentMutation.mutate()} disabled={addAssignmentMutation.isPending}>Add Assignment</Button>
        </DialogContent>
      </Dialog>

      {/* View Students Dialog */}
      <Dialog open={viewStudentsDialogOpen} onOpenChange={setViewStudentsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enrolled Students</DialogTitle></DialogHeader>
          <ul className="space-y-2">
            {students.length === 0 ? (
              <li>No students enrolled yet.</li>
            ) : students.map(s => (
              <li key={s.id} className="flex items-center gap-2">
                <Avatar className="h-6 w-6"><AvatarFallback>{s.name?.charAt(0) || 'S'}</AvatarFallback></Avatar>
                <span>{s.name} ({s.email})</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {/* Schedule Live Class Dialog */}
      <Dialog open={scheduleLiveClassDialogOpen} onOpenChange={setScheduleLiveClassDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Live Class</DialogTitle></DialogHeader>
          <Input placeholder="Title" value={liveClassTitle} onChange={e => setLiveClassTitle(e.target.value)} />
          <Input type="datetime-local" className="mt-2" value={liveClassStartTime} onChange={e => setLiveClassStartTime(e.target.value)} />
          <Input type="number" className="mt-2" placeholder="Duration (minutes)" value={liveClassDuration} onChange={e => setLiveClassDuration(e.target.value)} />
          <Input className="mt-2" placeholder="Meeting URL" value={liveClassMeetingUrl} onChange={e => setLiveClassMeetingUrl(e.target.value)} />
          <Button className="mt-4 w-full" onClick={() => scheduleLiveClassMutation.mutate()} disabled={scheduleLiveClassMutation.isPending}>Schedule</Button>
        </DialogContent>
      </Dialog>

      {/* Text Lesson Dialog */}
      <Dialog open={textLessonDialogOpen} onOpenChange={setTextLessonDialogOpen}>
        <DialogContent className="max-w-2xl w-[90vw] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Lesson Content</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto prose max-w-none" style={{ minHeight: 0 }}>
            <div dangerouslySetInnerHTML={{ __html: currentTextLessonContent }} />
          </div>
          <Button className="mt-4" onClick={() => setTextLessonDialogOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <Dialog open={editLessonDialogOpen} onOpenChange={(open) => { 
        setEditLessonDialogOpen(open); 
        if (!open) setEditItem(null); 
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Lesson</DialogTitle></DialogHeader>
          {editItem && typeof editItem === 'object' && (
            <>
              <select className="w-full mb-2" value={editItem.module_id} onChange={e => setEditItem({ ...editItem, module_id: e.target.value })}>
                <option value="">Select Module</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              <Input placeholder="Lesson Title" value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} />
              <select className="w-full mt-2" value={editItem.type} onChange={e => setEditItem({ ...editItem, type: e.target.value })}>
                <option value="video">Video</option>
                <option value="text">Text</option>
              </select>
              {editItem.type === 'video' && (
                <Input className="mt-2" placeholder="YouTube Video URL" value={editItem.video_url} onChange={e => setEditItem({ ...editItem, video_url: e.target.value })} />
              )}
              {editItem.type === 'text' && (
                <div className="mt-2">
                  <ReactQuill value={editItem.content} onChange={e => setEditItem({ ...editItem, content: e })} theme="snow"
                    style={{ maxHeight: 600, overflowY: 'auto' }}
                  />
                </div>
              )}
              <Input className="mt-2" type="number" min="1" placeholder="Duration (minutes)" value={editItem.duration} onChange={e => setEditItem({ ...editItem, duration: e.target.value ? parseInt(e.target.value, 10) : null })} />
              <Button className="mt-4 w-full" onClick={() => { if (editItem) updateLessonMutation.mutate(editItem); setEditLessonDialogOpen(false); setEditItem(null); }} disabled={updateLessonMutation.isPending}>Save</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={editModuleDialogOpen} onOpenChange={(open) => { setEditModuleDialogOpen(open); if (!open) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Module</DialogTitle></DialogHeader>
          {editItem && typeof editItem === 'object' && (
            <>
              <Input placeholder="Module Title" value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} />
              <Button className="mt-4 w-full" onClick={() => { if (editItem) updateModuleMutation.mutate(editItem); setEditModuleDialogOpen(false); setEditItem(null); }}>Save</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={editAssignmentDialogOpen} onOpenChange={(open) => { setEditAssignmentDialogOpen(open); if (!open) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Assignment</DialogTitle></DialogHeader>
          {editItem && typeof editItem === 'object' && (
            <>
              <Input placeholder="Assignment Title" value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} />
              <Input type="date" className="mt-2" value={editItem.due_date} onChange={e => setEditItem({ ...editItem, due_date: e.target.value })} />
              <Button className="mt-4 w-full" onClick={() => { if (editItem) updateAssignmentMutation.mutate(editItem); setEditAssignmentDialogOpen(false); setEditItem(null); }}>Save</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Live Class Dialog */}
      <Dialog open={editLiveClassDialogOpen} onOpenChange={(open) => { setEditLiveClassDialogOpen(open); if (!open) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Live Class</DialogTitle></DialogHeader>
          {editItem && typeof editItem === 'object' && (
            <>
              <Input placeholder="Title" value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} />
              <Input type="datetime-local" className="mt-2" value={editItem.start_time} onChange={e => setEditItem({ ...editItem, start_time: e.target.value })} />
              <Input type="number" className="mt-2" placeholder="Duration (minutes)" value={editItem.duration} onChange={e => setEditItem({ ...editItem, duration: e.target.value ? parseInt(e.target.value, 10) : null })} />
              <Input className="mt-2" placeholder="Meeting URL" value={editItem.meeting_url} onChange={e => setEditItem({ ...editItem, meeting_url: e.target.value })} />
              <Button className="mt-4 w-full" onClick={() => { if (editItem) updateLiveClassMutation.mutate(editItem); setEditLiveClassDialogOpen(false); setEditItem(null); }}>Save</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
          <p>Are you sure you want to delete this {deleteConfirm?.type}?</p>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => {
              if (deleteConfirm) {
                if (deleteConfirm.type === 'lesson') {
                  deleteLessonMutation.mutate(deleteConfirm.id);
                } else if (deleteConfirm.type === 'module') {
                  deleteModuleMutation.mutate(deleteConfirm.id);
                } else if (deleteConfirm.type === 'assignment') {
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

      {/* PDF Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={(open) => {
        setPdfDialogOpen(open);
        if (!open && currentPdfLessonId) {
          handleCompleteLesson(currentPdfLessonId);
          setCurrentPdfLessonId(null);
        }
      }}>
        <DialogContent className="max-w-4xl w-[90vw] h-[80vh]">
          <DialogHeader>
            <DialogTitle>PDF Lesson</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full">
            <iframe
              src={currentPdfUrl}
              className="w-full h-full"
              style={{ minHeight: 500 }}
              allow="autoplay"
              title="PDF Lesson"
            ></iframe>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Resource Confirmation Dialog */}
      <Dialog open={!!deleteResourceId} onOpenChange={open => { if (!open) setDeleteResourceId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Resource</DialogTitle></DialogHeader>
          <p>Are you sure you want to delete this resource? This cannot be undone.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="destructive" onClick={handleDeleteResource} disabled={deleteResourceLoading}>
              {deleteResourceLoading ? 'Deleting...' : 'Delete'}
            </Button>
            <Button onClick={() => setDeleteResourceId(null)} disabled={deleteResourceLoading}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {enrollment && profile?.role === 'student' && (
        <div className="mt-4">
          <Button variant="destructive" onClick={() => setWithdrawDialogOpen(true)} disabled={withdrawing}>
            {withdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Withdraw from Course
          </Button>
          <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw from Course</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to withdraw from this course? You will lose access to all premium content and your progress will be lost.</p>
              <div className="flex gap-2 mt-4 justify-end">
                <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)} disabled={withdrawing}>Cancel</Button>
                <Button variant="destructive" onClick={handleWithdraw} disabled={withdrawing}>
                  {withdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Yes, Withdraw
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
