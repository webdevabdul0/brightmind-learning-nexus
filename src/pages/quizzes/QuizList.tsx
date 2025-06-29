import React, { useEffect, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, CheckCircle, FileText, Pencil, Trash } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  scheduled_at: string;
  attempt_duration: number;
  status: string;
  course_id: string;
}

const QuizList: React.FC = () => {
  const { user, profile } = useAuth();
  const role = profile?.role;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [attemptedQuizIds, setAttemptedQuizIds] = useState<string[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<{ [quizId: string]: any }>({});
  const [courseTitles, setCourseTitles] = useState<{ [courseId: string]: string }>({});

  // Fetch quizzes with React Query
  const { data: quizzes = [], isLoading: loading } = useQuery({
    queryKey: ['quizzes', user?.id, role],
    queryFn: async () => {
      if (!user) return [];
      if (role === 'teacher') {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('created_by', user.id)
          .order('scheduled_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } else if (role === 'student') {
        // Fetch quizzes for enrolled courses
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', user.id);
        if (enrollError) throw enrollError;
        const courseIds = enrollments?.map((e: any) => e.course_id) || [];
        if (courseIds.length === 0) return [];
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .in('course_id', courseIds)
          .order('scheduled_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } else {
        // No quizzes for admin
        return [];
      }
    },
    enabled: !!user && !!role,
  });

  useEffect(() => {
    if (role === 'student' && user) {
      const fetchAttempts = async () => {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('quiz_id, grade, remark')
          .eq('student_id', user.id);
        if (!error && data) {
          setAttemptedQuizIds(data.map((a: any) => a.quiz_id));
          const attemptsMap: { [quizId: string]: any } = {};
          data.forEach((a: any) => { attemptsMap[a.quiz_id] = a; });
          setQuizAttempts(attemptsMap);
        }
      };
      fetchAttempts();
    }
  }, [role, user]);

  useEffect(() => {
    // Fetch course titles for all quizzes
    if (quizzes.length > 0) {
      const fetchCourseTitles = async () => {
        const courseIds = Array.from(new Set(quizzes.map((q: any) => q.course_id)));
        if (courseIds.length === 0) return;
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIds);
        if (!error && data) {
          const map: { [courseId: string]: string } = {};
          data.forEach((c: any) => { map[c.id] = c.title; });
          setCourseTitles(map);
        }
      };
      fetchCourseTitles();
    }
  }, [quizzes]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quizzes</h1>
        {role === 'teacher' && (
          <Button onClick={() => navigate('/quizzes/create')}>Add Quiz</Button>
        )}
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {quizzes.length === 0 ? (
            <div>No quizzes found.</div>
          ) : (
            quizzes.map((quiz) => {
              const scheduledDate = new Date(quiz.scheduled_at);
              const endDate = new Date(scheduledDate.getTime() + quiz.attempt_duration * 60000);
              const now = new Date();
              return (
                <Card key={quiz.id} className="overflow-hidden transition-all hover:shadow-md bg-card text-card-foreground border border-border">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">{quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}</Badge>
                        <span className="font-semibold text-lg">{quiz.title}</span>
                        {courseTitles[quiz.course_id] && (
                          <span className="ml-2 text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">{courseTitles[quiz.course_id]}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Scheduled: {scheduledDate.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Duration: {quiz.attempt_duration} min</div>
                    </div>
                    <div className="mt-2 md:mt-0 flex flex-col gap-2 items-end">
                      {role === 'teacher' && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="secondary" onClick={() => navigate(`/quizzes/${quiz.id}/grade`)}>Submissions</Button>
                          <Button variant="destructive" size="icon" onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this quiz?')) {
                              const { error } = await supabase.from('quizzes').delete().eq('id', quiz.id);
                              if (!error) {
                                toast({ title: 'Quiz deleted' });
                                queryClient.invalidateQueries(['quizzes', user?.id, role]);
                              } else {
                                toast({ title: 'Failed to delete quiz', description: error.message, variant: 'destructive' });
                              }
                            }
                          }}><Trash className="h-4 w-4" /></Button>
                        </div>
                      )}
                      {role === 'student' && now >= scheduledDate && now < endDate && (
                        <Button 
                          onClick={() => navigate(`/quizzes/${quiz.id}/attempt`)}
                          disabled={attemptedQuizIds.includes(quiz.id)}
                        >
                          {attemptedQuizIds.includes(quiz.id) ? 'Attempted' : 'Attempt'}
                        </Button>
                      )}
                      {role === 'student' && attemptedQuizIds.includes(quiz.id) && (
                        <Button variant="outline" size="sm" onClick={() => navigate(`/quizzes/${quiz.id}/attempt`)}>
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                          View Grade & Remark
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Student grade/remark display */}
                  {role === 'student' && quizAttempts[quiz.id] && (
                    <div className="mx-4 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-700">Grade:</span>
                        <span className="text-green-900">{typeof quizAttempts[quiz.id].grade !== 'undefined' ? quizAttempts[quiz.id].grade : 'N/A'}</span>
                      </div>
                      {quizAttempts[quiz.id].remark && (
                        <div className="flex items-start gap-2 mt-1">
                          <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                          <span className="text-blue-900 dark:text-blue-200">{quizAttempts[quiz.id].remark}</span>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default QuizList; 