import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Video, 
  Plus, 
  Search,
  Calendar,
  Trash,
  Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase, AdminCourse, AdminStudent, AdminAssignment } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/providers/AuthProvider';

const AdminDashboard = () => {
  const { profile } = useAuth();
  // Only allow admin access
  if (profile?.role !== 'admin') {
    return <div className="p-8 text-center text-red-600 font-bold">Unauthorized: Admins only</div>;
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    instructor_id: '',
    price: '',
    duration: '',
    level: '',
    image_url: ''
  });
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [editCourseForm, setEditCourseForm] = useState<any>(null);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch all courses with student counts
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<AdminCourse[]>({
    queryKey: ['adminCourses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`*, enrollments:enrollments(count), instructor:instructor_id(name)`);
      if (error) {
        toast({ title: 'Error fetching courses', description: error.message, variant: 'destructive' });
        throw error;
      }
      return data;
    }
  });

  // Fetch all students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<AdminStudent[]>({
    queryKey: ['adminStudents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');
      if (error) {
        toast({ title: 'Error fetching students', description: error.message, variant: 'destructive' });
        throw error;
      }
      return data;
    }
  });

  // Fetch recent assignments
  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery<AdminAssignment[]>({
    queryKey: ['adminAssignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, course:courses(title), submissions:assignment_submissions(count)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) {
        toast({ title: 'Error fetching assignments', description: error.message, variant: 'destructive' });
        throw error;
      }
      console.log('Fetched admin assignments:', data);
      return data;
    }
  });

  // Fetch recent lectures
  const { data: lectures = [], isLoading: isLoadingLectures } = useQuery<any[]>({
    queryKey: ['adminLectures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('id, title, module_id, created_at, module:course_modules(title), course:courses(title)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) {
        toast({ title: 'Error fetching lectures', description: error.message, variant: 'destructive' });
        throw error;
      }
      return data;
    }
  });

  // Add teacher query
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery<any[]>({
    queryKey: ['adminTeachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher');
      if (error) {
        toast({ title: 'Error fetching teachers', description: error.message, variant: 'destructive' });
        throw error;
      }
      return data;
    }
  });

  // Fetch recent quizzes
  const { data: quizzes = [], isLoading: isLoadingQuizzes } = useQuery<any[]>({
    queryKey: ['adminQuizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*, course:courses(title), teacher:created_by(name)')
        .order('scheduled_at', { ascending: false })
        .limit(10);
      if (error) {
        toast({ title: 'Error fetching quizzes', description: error.message, variant: 'destructive' });
        throw error;
      }
      return data;
    }
  });

  // Mutation to change user role
  const changeUserRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      if (!['student', 'teacher', 'admin'].includes(role)) throw new Error('Invalid role');
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
      if (error) throw error;
      return { id, role };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTeachers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      toast({ title: 'Role updated', description: 'User role updated successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating role', description: error.message, variant: 'destructive' });
    }
  });

  const createCourseMutation = useMutation({
    mutationFn: async (course: any) => {
      if (!course.instructor_id) throw new Error('Instructor is required');
      const { error } = await supabase.from('courses').insert({
        ...course,
        price: course.price ? Number(course.price) : null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      setCreateCourseOpen(false);
      setCourseForm({ title: '', description: '', category: '', instructor_id: '', price: '', duration: '', level: '', image_url: '' });
      toast({ title: 'Course created', description: 'The course has been created successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error creating course', description: error.message, variant: 'destructive' });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (course: any) => {
      // Only send valid fields for the courses table
      const {
        id,
        title,
        description,
        instructor_id,
        category,
        image_url,
        duration,
        level,
        price
      } = course;
      const { error } = await supabase
        .from('courses')
        .update({
          title,
          description,
          instructor_id,
          category,
          image_url,
          duration,
          level,
          price: price ? Number(price) : null
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      setEditCourseOpen(false);
      setEditCourseForm(null);
      toast({ title: 'Course updated', description: 'The course has been updated successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating course', description: error.message, variant: 'destructive' });
      console.log('Update course error:', error);
    }
  });

  const handleCourseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCourseForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    createCourseMutation.mutate(courseForm);
  };

  // Delete course and cascade related entities
  const handleDeleteCourse = async () => {
    if (!deleteCourseId) return;
    setDeleteLoading(true);
    try {
      // Delete quizzes
      await supabase.from('quizzes').delete().eq('course_id', deleteCourseId);
      // Delete assignments
      await supabase.from('assignments').delete().eq('course_id', deleteCourseId);
      // Delete live classes
      await supabase.from('live_classes').delete().eq('course_id', deleteCourseId);
      // Optionally: delete modules, lessons, resources, enrollments, etc.
      // Delete the course itself
      const { error } = await supabase.from('courses').delete().eq('id', deleteCourseId);
      if (error) throw error;
      toast({ title: 'Course deleted', description: 'The course and all related content have been deleted.' });
      setDeleteCourseId(null);
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    } catch (err: any) {
      toast({ title: 'Failed to delete course', description: err.message, variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage courses, students, and content</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Input
              type="search"
              placeholder="Search..."
              className="w-full md:w-[300px] pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
          </div>
          <Button onClick={() => setCreateCourseOpen(true)} >
            <Plus className="h-4 w-4 mr-2"  />
            Create Course
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">
              {courses.length} courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              {students.length} students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {assignments.filter(a => new Date(a.due_date) > new Date()).length} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lectures</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lectures.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {courses.length} courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
            <p className="text-xs text-muted-foreground">
              {teachers.length} teachers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="lectures">Lectures</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingQuizzes ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  quizzes.slice(0, 5).map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-5 w-5 text-brightmind-blue" />
                        <div>
                          <p className="font-medium">{quiz.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {quiz.course?.title} • Scheduled {new Date(quiz.scheduled_at).toLocaleDateString()} • Teacher: {quiz.teacher?.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Quiz</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingAssignments ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  assignments.slice(0, 5).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-5 w-5 text-brightmind-blue" />
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.course?.title} • Due {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {assignment.submissions?.[0]?.count || 0} submissions
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Course Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingCourses ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{course.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Course</Badge>
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditCourseForm({ ...course });
                            setEditCourseOpen(true);
                          }}>Edit</Button>
                          <Button variant="destructive" size="icon" onClick={() => setDeleteCourseId(course.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Students</span>
                          <span>{course.enrollments?.[0]?.count || 0}</span>
                        </div>
                        <Progress value={(course.enrollments?.[0]?.count || 0) / 100 * 100} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          {/* Course Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Course Management</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingCourses ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Instructor: {course.instructor?.name}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">
                            Course
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditCourseForm({ ...course });
                            setEditCourseOpen(true);
                          }}>Edit</Button>
                          <Button variant="destructive" size="icon" onClick={() => setDeleteCourseId(course.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Enrolled Students</span>
                          <span>{course.enrollments?.[0]?.count || 0}</span>
                        </div>
                        <Progress value={(course.enrollments?.[0]?.count || 0) / 100 * 100} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          {/* Student Management */}
          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingStudents ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  students.map((student) => (
                    <div key={student.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">Student</Badge>
                          <Button variant="outline" size="sm" onClick={() => changeUserRole.mutate({ id: student.id, role: 'teacher' })}>Promote to Teacher</Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {/* Assignment Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Assignment Management</CardTitle>
                
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingAssignments ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  assignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{assignment.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {assignment.course?.title} • Due {new Date(assignment.due_date).toLocaleDateString()} • Teacher: {courses.find(c => c.id === assignment.course_id)?.instructor?.name || 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            {assignment.submissions?.[0]?.count || 0} submissions
                          </Badge>
                         
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          {/* Quiz Management */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingQuizzes ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  quizzes.map((quiz) => (
                    <div key={quiz.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{quiz.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {quiz.course?.title} • Scheduled {new Date(quiz.scheduled_at).toLocaleDateString()} • Teacher: {quiz.teacher?.name || 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Quiz</Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lectures" className="space-y-4">
          {/* Lecture Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Lecture Management</CardTitle>
               
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingLectures ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  lectures.map((lecture) => (
                    <div key={lecture.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{lecture.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {lecture.module?.title} • {lecture.course?.title} • Teacher: {courses.find(c => c.id === lecture.course?.id)?.instructor?.name || 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                        
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          {/* Teacher Management */}
          <Card>
            <CardHeader>
              <CardTitle>Teacher Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingTeachers ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  teachers.map((teacher) => {
                    // Filter assignments and lectures for this teacher
                    const teacherAssignments = assignments.filter(a => courses.find(c => c.id === a.course_id && c.instructor_id === teacher.id));
                    const teacherLectures = lectures.filter(l => {
                      const module = l.module;
                      const course = l.course;
                      return course && courses.find(c => c.id === course.id && c.instructor_id === teacher.id);
                    });
                    return (
                      <div key={teacher.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{teacher.name}</h3>
                            <p className="text-sm text-muted-foreground">{teacher.email}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="default">Teacher</Badge>
                            <Button variant="outline" size="sm" onClick={() => changeUserRole.mutate({ id: teacher.id, role: 'student' })}>Remove as Teacher</Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="font-semibold text-sm">Assignments Uploaded:</p>
                          <ul className="list-disc ml-5 text-xs">
                            {teacherAssignments.length === 0 ? <li>None</li> : teacherAssignments.map(a => <li key={a.id}>{a.title}</li>)}
                          </ul>
                          <p className="font-semibold text-sm mt-2">Lectures Uploaded:</p>
                          <ul className="list-disc ml-5 text-xs">
                            {teacherLectures.length === 0 ? <li>None</li> : teacherLectures.map(l => <li key={l.id}>{l.title}</li>)}
                          </ul>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Course Confirmation Dialog (moved outside Tabs) */}
      <Dialog open={!!deleteCourseId} onOpenChange={open => { if (!open) setDeleteCourseId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this course? This will also delete all related quizzes, assignments, and live classes. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteCourse} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
            <Button onClick={() => setDeleteCourseId(null)} disabled={deleteLoading}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createCourseOpen} onOpenChange={setCreateCourseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input name="title" value={courseForm.title} onChange={handleCourseFormChange} required />
            </div>
            <div>
              <Label>Description</Label>
              <Input name="description" value={courseForm.description} onChange={handleCourseFormChange} required />
            </div>
            <div>
              <Label>Category</Label>
              <Input name="category" value={courseForm.category} onChange={handleCourseFormChange} required />
            </div>
            <div>
              <Label>Instructor</Label>
              <select name="instructor_id" value={courseForm.instructor_id} onChange={handleCourseFormChange} required className="w-full border rounded p-2">
                <option value="">Select Instructor</option>
                {teachers.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Price</Label>
              <Input name="price" type="number" value={courseForm.price} onChange={handleCourseFormChange} />
            </div>
            <div>
              <Label>Duration</Label>
              <Input name="duration" value={courseForm.duration} onChange={handleCourseFormChange} />
            </div>
            <div>
              <Label>Level</Label>
              <Input name="level" value={courseForm.level} onChange={handleCourseFormChange} />
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={createCourseMutation.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editCourseOpen} onOpenChange={setEditCourseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          {editCourseForm && (
            <form className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input name="title" value={editCourseForm.title} onChange={e => setEditCourseForm({ ...editCourseForm, title: e.target.value })} required />
              </div>
              <div>
                <Label>Description</Label>
                <Input name="description" value={editCourseForm.description} onChange={e => setEditCourseForm({ ...editCourseForm, description: e.target.value })} required />
              </div>
              <div>
                <Label>Category</Label>
                <Input name="category" value={editCourseForm.category} onChange={e => setEditCourseForm({ ...editCourseForm, category: e.target.value })} required />
              </div>
              <div>
                <Label>Instructor</Label>
                <select name="instructor_id" value={editCourseForm.instructor_id} onChange={e => setEditCourseForm({ ...editCourseForm, instructor_id: e.target.value })} required className="w-full border rounded p-2">
                  <option value="">Select Instructor</option>
                  {teachers.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Price</Label>
                <Input name="price" type="number" value={editCourseForm.price} onChange={e => setEditCourseForm({ ...editCourseForm, price: e.target.value })} />
              </div>
              <div>
                <Label>Duration</Label>
                <Input name="duration" value={editCourseForm.duration} onChange={e => setEditCourseForm({ ...editCourseForm, duration: e.target.value })} />
              </div>
              <div>
                <Label>Level</Label>
                <Input name="level" value={editCourseForm.level} onChange={e => setEditCourseForm({ ...editCourseForm, level: e.target.value })} />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input name="image_url" value={editCourseForm.image_url} onChange={e => setEditCourseForm({ ...editCourseForm, image_url: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" onClick={() => setEditCourseOpen(false)}>Cancel</Button>
                <Button type="button" onClick={() => updateCourseMutation.mutate(editCourseForm)} disabled={updateCourseMutation.isPending}>Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard; 