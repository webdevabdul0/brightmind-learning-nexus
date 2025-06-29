import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, FileText, Calendar, CheckCircle, AlertCircle, Upload, MessageSquare, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { supabase, sendNotifications } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AssignmentCardProps {
  assignment: any;
  onUpload: (e: React.MouseEvent, assignmentId: string) => void;
  profile?: any;
  user?: any;
  handleViewDetails?: (assignmentId: string) => void;
  handleEdit?: (assignment: any) => void;
  handleDelete?: (assignmentId: string) => void;
}

const AssignmentCard = ({ assignment, onUpload, profile, user, handleViewDetails, handleEdit, handleDelete }: AssignmentCardProps) => {
  const { toast } = useToast();
  const isStudent = profile?.role === 'student';
  const isCompleted = assignment.status === 'completed';
  const isSubmittedForGrading = assignment.status === 'submitted_for_grading';
  const questionUrl = assignment.question_pdf_url;
  const submissionUrl = assignment.file_url;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'submitted_for_grading': return 'bg-blue-500';
      case 'pending': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md bg-card text-card-foreground border border-border">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <Badge className={getStatusColor(assignment.status)} variant="secondary">
              {assignment.status === 'submitted_for_grading' ? 'Submitted for Grading' : 
               assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
            </Badge>
            <CardTitle className="mt-2">{assignment.title}</CardTitle>
            <CardDescription>{assignment.course?.title || 'General'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground mb-4">{assignment.description}</p>
        <div className="space-y-4">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Due: {formatDate(assignment.due_date)}</span>
          </div>
          {(assignment.status === 'submitted_for_grading' || assignment.status === 'completed') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{assignment.progress || 0}%</span>
              </div>
              <Progress value={assignment.progress || 0} className="h-2" />
            </div>
          )}
          {/* Student grade/feedback display */}
          {isStudent && isCompleted && (typeof assignment.grade !== 'undefined' || typeof assignment.feedback !== 'undefined') && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-700">Grade:</span>
                <span className="text-green-900">{assignment.grade ?? 'N/A'}</span>
              </div>
              {assignment.feedback && (
                <div className="flex items-start gap-2 mt-1">
                  <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                  <span className="text-blue-900">{assignment.feedback}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex flex-wrap gap-2 w-full items-center">
          {/* Student Buttons */}
          {isStudent && questionUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={questionUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-1" />
                {isCompleted ? 'Download Question' : 'View Question'}
              </a>
            </Button>
          )}
          {isStudent && isSubmittedForGrading && (
            <Button size="sm" variant="secondary" onClick={(e) => onUpload(e, assignment.id)}>
              <Upload className="h-4 w-4 mr-1" />
              Resubmit
            </Button>
          )}
          {isStudent && !isCompleted && !isSubmittedForGrading && (
            <Button size="sm" onClick={(e) => onUpload(e, assignment.id)}>
              <Upload className="h-4 w-4 mr-1" />
              Submit
            </Button>
          )}
          {isStudent && isCompleted && submissionUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={submissionUrl} target="_blank" rel="noopener noreferrer">
                <Upload className="h-4 w-4 mr-1" />
                Download Submission
              </a>
            </Button>
          )}
          {/* Teacher Buttons */}
          {profile?.role === 'teacher' && user?.id === assignment.course?.instructor_id && (
            <>
              <Button variant="ghost" size="icon" onClick={() => handleEdit(assignment)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment.id)}><Trash className="h-4 w-4 text-red-500" /></Button>
            </>
          )}
          {/* Teacher Button */}
          {profile?.role === 'teacher' && handleViewDetails && (
            <Button variant="outline" size="sm" onClick={() => handleViewDetails(assignment.id)}>
              <FileText className="h-4 w-4 mr-1" />
              View Submissions
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const AssignmentList = () => {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch user enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ['userEnrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id);
      if (error) throw error;
      console.log('Fetched enrollments in AssignmentList:', data);
      return data || [];
    },
    enabled: !!user
  });
  const enrolledCourseIds = enrollments.map((e: any) => e.course_id);

  // Fetch assignments for enrolled courses
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments', user?.id],
    queryFn: async () => {
      if (!user || enrolledCourseIds.length === 0) return [];
      const { data, error } = await supabase
        .from('assignments')
        .select(`*, course:courses(id, title)`)
        .in('course_id', enrolledCourseIds)
        .order('due_date');
      if (error) {
        toast({
          title: "Error fetching assignments",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      console.log('Fetched assignments for enrolled courses:', data);
      // Fetch submission status for each assignment
      const assignmentsWithStatus = await Promise.all(
        data.map(async (assignment) => {
          const { data: submission } = await supabase
            .from('assignment_submissions')
            .select('*')
            .eq('assignment_id', assignment.id)
            .eq('student_id', user.id)
            .single();
          let status = 'pending';
          let progress = 0;
          if (submission) {
            status = submission.status;
            progress = status === 'completed' ? 100 : 
                      status === 'submitted_for_grading' ? 65 : 0;
          }
          return {
            ...assignment,
            status,
            progress,
            grade: submission?.grade,
            feedback: submission?.feedback,
            file_url: submission?.file_url
          };
        })
      );
      return assignmentsWithStatus;
    },
    enabled: !!user && enrolledCourseIds.length > 0
  });

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (assignment.course?.title && assignment.course.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || assignment.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAssignmentClick = (assignmentId: string) => {
    navigate(`/assignments/${assignmentId}`);
  };

  const handleUpload = async (e: React.MouseEvent, assignmentId: string) => {
    e.stopPropagation();
    // Open file dialog for PDF
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      if (file.type !== 'application/pdf') {
        toast({ title: 'Invalid file', description: 'Please upload a PDF file.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Uploading...', description: 'Your assignment is being uploaded.' });
      // Upload to Supabase Storage
      const filePath = `student-${user.id}/assignment-${assignmentId}-${Date.now()}.pdf`;
      console.log('Uploading to bucket:', 'assignments', 'filePath:', filePath, 'file:', file);
      const { data: uploadData, error: uploadError } = await supabase.storage.from('assignments').upload(filePath, file);
      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        return;
      }
      // Get public URL (or use signed URL if private)
      const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(filePath);
      const fileUrl = urlData?.publicUrl || '';
      // Insert submission record
      const { error: subError } = await supabase.from('assignment_submissions').upsert({
        assignment_id: assignmentId,
        student_id: user.id,
        file_url: fileUrl,
        submitted_at: new Date().toISOString(),
        status: 'submitted_for_grading'
      });
      if (subError) {
        toast({ title: 'Submission failed', description: subError.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Assignment submitted', description: 'Your PDF has been uploaded.' });
      // Notify the course teacher
      // Get assignment and course info
      const { data: assignment } = await supabase.from('assignments').select('title, course_id').eq('id', assignmentId).single();
      if (assignment) {
        const { data: course } = await supabase.from('courses').select('instructor_id, title').eq('id', assignment.course_id).single();
        if (course && course.instructor_id) {
          await sendNotifications([
            course.instructor_id
          ],
          'Assignment Submitted',
          `A student has submitted the assignment "${assignment.title}" for your course "${course.title}".
`,
          'submission',
          `/assignments/${assignmentId}`
          );
        }
      }
    };
    input.click();
  };

  const pendingCount = assignments.filter(a => a.status === 'pending').length;
  const submittedForGradingCount = assignments.filter(a => a.status === 'submitted_for_grading').length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;

  // Render skeleton loaders
  const renderSkeletons = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
      <div key={i} className="rounded-xl p-6 bg-slate-100">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    ));
  };

  const [viewSubmissionsDialogOpen, setViewSubmissionsDialogOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [grading, setGrading] = useState<{ [submissionId: string]: boolean }>({});
  const [grades, setGrades] = useState<{ [submissionId: string]: string }>({});
  const [feedbacks, setFeedbacks] = useState<{ [submissionId: string]: string }>({});

  const fetchSubmissions = async (assignmentId: string) => {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('id, student_id, file_url, grade, status, submitted_at, student:student_id(name, email)')
      .eq('assignment_id', assignmentId);
    if (!error) setSubmissions(data || []);
  };

  const handleViewDetails = async (assignmentId: string) => {
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
      // Notify student
      await sendNotifications([
        studentId
      ],
      'Assignment Graded',
      `Your assignment has been graded. Grade: ${grade}` + (feedback ? `\nFeedback: ${feedback}` : ''),
      'grade',
      '/assignments');
      await fetchSubmissions(selectedAssignmentId!);
    } else {
      toast({ title: 'Failed to grade', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (assignment: any) => {
    alert('Edit assignment: ' + assignment.title);
  };
  const handleDelete = (assignmentId: string) => {
    alert('Delete assignment: ' + assignmentId);
  };

  return (
    <div className="container mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Assignments</h1>
          <p className="text-gray-600">Manage and track your assignments</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Input
              type="search"
              placeholder="Search assignments..."
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

      {/* Assignment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <Card className="bg-amber-50/80 border border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-700 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700">{pendingCount}</p>
            <p className="text-sm text-amber-600">Assignments pending submission</p>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50/80 border border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-700 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Submitted for Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{submittedForGradingCount}</p>
            <p className="text-sm text-blue-600">Assignments submitted for grading</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50/80 border border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-700 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{completedCount}</p>
            <p className="text-sm text-green-600">Assignments submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Tabs */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setSelectedStatus('all')}>All</TabsTrigger>
          <TabsTrigger value="pending" onClick={() => setSelectedStatus('pending')}>Pending</TabsTrigger>
          <TabsTrigger value="submitted_for_grading" onClick={() => setSelectedStatus('submitted_for_grading')}>Submitted for Grading</TabsTrigger>
          <TabsTrigger value="completed" onClick={() => setSelectedStatus('completed')}>Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons(6)}
            </div>
          ) : filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map(assignment => (
                <AssignmentCard 
                  key={assignment.id}
                  assignment={assignment}
                  onUpload={handleUpload}
                  profile={profile}
                  user={user}
                  handleViewDetails={handleViewDetails}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No assignments found</h3>
              <p className="text-muted-foreground mb-4">There are no assignments that match your criteria.</p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
              }}>Clear filters</Button>
            </div>
          )}
        </TabsContent>
        
        {/* Content for other tabs is similar but filtered, using the same components */}
        <TabsContent value="pending" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons(3)}
            </div>
          ) : filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map(assignment => (
                <AssignmentCard 
                  key={assignment.id}
                  assignment={assignment}
                  onUpload={handleUpload}
                  profile={profile}
                  user={user}
                  handleViewDetails={handleViewDetails}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pending assignments</h3>
              <p className="text-muted-foreground mb-4">You don't have any pending assignments at the moment.</p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
              }}>View all assignments</Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="submitted_for_grading" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons(2)}
            </div>
          ) : filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map(assignment => (
                <AssignmentCard 
                  key={assignment.id}
                  assignment={assignment}
                  onUpload={handleUpload}
                  profile={profile}
                  user={user}
                  handleViewDetails={handleViewDetails}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No assignments submitted for grading</h3>
              <p className="text-muted-foreground mb-4">You don't have any assignments submitted for grading.</p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
              }}>View all assignments</Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons(2)}
            </div>
          ) : filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map(assignment => (
                <AssignmentCard 
                  key={assignment.id}
                  assignment={assignment}
                  onUpload={handleUpload}
                  profile={profile}
                  user={user}
                  handleViewDetails={handleViewDetails}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No completed assignments</h3>
              <p className="text-muted-foreground mb-4">You haven't completed any assignments yet.</p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
              }}>View all assignments</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submissions Dialog for Teachers */}
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
    </div>
  );
};

export default AssignmentList;
