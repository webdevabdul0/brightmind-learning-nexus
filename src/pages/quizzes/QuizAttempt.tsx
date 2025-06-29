import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';

export default function QuizAttempt() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [page, setPage] = useState(0);
  const [timer, setTimer] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const [remark, setRemark] = useState<string | undefined>(undefined);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'student') {
      navigate('/quizzes');
      return;
    }
    const fetchQuiz = async () => {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();
      if (quizError || !quizData) {
        toast({ title: 'Error', description: 'Quiz not found.' });
        navigate('/quizzes');
        return;
      }
      // Check for existing attempt
      const { data: attemptData } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', id)
        .eq('student_id', user.id)
        .single();
      if (attemptData) {
        setSubmitted(true);
        setQuiz(quizData);
        setGrade(attemptData.grade);
        setRemark(attemptData.remark);
        setAnswers(attemptData.answers || {});
        return;
      }
      const scheduledDate = new Date(quizData.scheduled_at);
      const now = new Date();
      if (now < scheduledDate) {
        toast({ title: 'Quiz not available', description: 'Quiz is not available yet.' });
        navigate('/quizzes');
        return;
      }
      setQuiz(quizData);
      setTimer(quizData.attempt_duration * 60); // seconds
      const { data: questionData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id);
      setQuestions(questionData || []);
    };
    fetchQuiz();
  }, [id, profile, navigate, toast, user.id]);

  // Timer logic
  useEffect(() => {
    if (timer <= 0 || submitted) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, submitted]);

  // Pagination
  const questionsPerPage = 5;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const currentQuestions = questions.slice(page * questionsPerPage, (page + 1) * questionsPerPage);

  const handleAnswer = (qId: string, value: any) => {
    setAnswers(a => ({ ...a, [qId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Save answers
      const { error } = await supabase.from('quiz_attempts').insert({
        quiz_id: id,
        student_id: user.id,
        answers,
        submitted_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      setSubmitting(false);
      setSubmitted(true);
      toast({ title: 'Quiz submitted', description: 'Your quiz has been submitted.' });
      navigate('/quizzes');
    } catch (error) {
      setSubmitting(false);
      toast({ 
        title: 'Error submitting quiz',
        description: 'There was a problem submitting your quiz. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (!quiz) return <div className="p-6">Loading...</div>;
  if (submitted && grade !== undefined) return (
    <div className="p-6">
      Quiz submitted!<br/>
      <Button onClick={() => setGradeDialogOpen(true)}>View Grade & Remark</Button>
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Quiz Grade & Remark</DialogTitle>
          </DialogHeader>
          <div>Grade: {grade} / {questions.length}</div>
          <div>Remark: {remark || 'No remark yet.'}</div>
          {questions.map((q, idx) => (
            <div key={q.id} className="mb-2">
              <div className="font-semibold">Q{idx + 1}: {q.question_text}</div>
              <div>Your Answer: {answers[q.id]?.toString() ?? ''}</div>
              <div>Correct: {q.answer_type === 'option' ? (answers[q.id] === q.correct_option ? 'Yes' : 'No') : ''}</div>
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
  if (submitted) return (
    <div className="p-6">
      Quiz submitted! You cannot re-attempt.<br/>
      <Button onClick={() => setGradeDialogOpen(true)}>View Grade & Remark</Button>
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Quiz Grade & Remark</DialogTitle>
          </DialogHeader>
          <div>Grade: {grade !== undefined ? `${grade} / ${questions.length}` : 'Not graded yet.'}</div>
          <div>Remark: {remark || 'No remark yet.'}</div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Timer display
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card className="p-6 bg-card text-card-foreground border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Attempt Quiz: {quiz.title}</h2>
          <div className="text-lg font-mono bg-muted rounded px-3 py-1">{minutes}:{seconds.toString().padStart(2, '0')}</div>
        </div>
        {currentQuestions.map((q, idx) => (
          <div key={q.id} className="mb-8">
            <div className="text-lg font-semibold mb-2">Q{page * questionsPerPage + idx + 1}: {q.question_text}</div>
            {q.answer_type === 'option' ? (
              <div className="flex flex-col gap-2">
                {(q.options || '').split(',').map((opt: string, i: number) => (
                  <label key={i} className="bg-card border border-border rounded p-3 cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={i}
                      checked={answers[q.id] === i}
                      onChange={() => handleAnswer(q.id, i)}
                      className="mr-2"
                    />
                    {opt.trim() || `Option ${i + 1}`}
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                className="w-full border border-border rounded p-2 bg-background text-foreground"
                placeholder="Your answer"
                value={answers[q.id] || ''}
                onChange={e => handleAnswer(q.id, e.target.value)}
              />
            )}
          </div>
        ))}
        <div className="flex justify-between mt-6">
          <Button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
          {page < totalPages - 1 ? (
            <Button onClick={() => setPage(p => p + 1)}>Next</Button>
          ) : (
            <Button variant="success" onClick={() => setShowDialog(true)}>Save & Submit</Button>
          )}
        </div>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to submit your quiz? You cannot re-attempt after submission.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button variant="success" onClick={handleSubmit} disabled={submitting}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 