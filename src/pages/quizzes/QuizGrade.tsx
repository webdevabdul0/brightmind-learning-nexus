import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { supabase, sendNotifications } from '../../integrations/supabase/client';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

export default function QuizGrade() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [grading, setGrading] = useState<{ [attemptId: string]: boolean }>({});
  const [grades, setGrades] = useState<{ [attemptId: string]: string }>({});
  const [remarkState, setRemarkState] = useState<{ [attemptId: string]: string }>({});

  useEffect(() => {
    if (profile?.role !== 'teacher') {
      navigate('/quizzes');
      return;
    }
    const fetchData = async () => {
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();
      setQuiz(quizData);
      const { data: questionData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id);
      setQuestions(questionData || []);
      const { data: attemptData } = await supabase
        .from('quiz_attempts')
        .select('*, student:student_id(name, email)')
        .eq('quiz_id', id);
      setAttempts(attemptData || []);
    };
    fetchData();
  }, [id, profile, navigate]);

  const handleGrade = async (attempt: any) => {
    setGrading(g => ({ ...g, [attempt.id]: true }));
    const grade = Number(grades[attempt.id]);
    const remark = remarkState[attempt.id] || '';
    const { error } = await supabase
      .from('quiz_attempts')
      .update({ grade, remark, status: 'graded' })
      .eq('id', attempt.id);
    setGrading(g => ({ ...g, [attempt.id]: false }));
    if (!error) {
      toast({ title: 'Graded', description: 'Quiz graded.' });
      // Notify student
      await sendNotifications([
        attempt.student_id
      ],
      'Quiz Graded',
      `Your quiz has been graded. Grade: ${grade}` + (remark ? `\nRemark: ${remark}` : ''),
      'grade',
      '/quizzes');
    } else {
      toast({ title: 'Failed to grade', description: error.message, variant: 'destructive' });
    }
  };

  if (!quiz) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Grade Quiz: {quiz.title}</h2>
        {attempts.length === 0 ? (
          <div>No attempts yet.</div>
        ) : (
          attempts.map((attempt) => {
            const ans = attempt.answers || {};
            return (
              <Card key={attempt.id} className="mb-8 p-4 bg-gray-50">
                <div className="mb-2 font-semibold">Student: {attempt.student?.name || attempt.student_id}</div>
                {questions.map((q, idx) => {
                  let isCorrect = false;
                  if (q.answer_type === 'option') {
                    isCorrect = ans[q.id] === q.correct_option;
                  } else {
                    isCorrect = (ans[q.id] || '').trim().toLowerCase() === (q.correct_text_answer || '').trim().toLowerCase();
                  }
                  return (
                    <div key={q.id} className="mb-4">
                      <div className="font-medium">Q{idx + 1}: {q.question_text}</div>
                      <div className="ml-4">
                        <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {q.answer_type === 'option'
                            ? `Selected: ${(q.options || '').split(',')[ans[q.id]] || 'No answer'} (Correct: ${(q.options || '').split(',')[q.correct_option]})`
                            : `Answer: ${ans[q.id] || 'No answer'} (Correct: ${q.correct_text_answer || 'N/A'})`}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-4 items-center mt-4">
                  <Input
                    type="number"
                    min={0}
                    max={questions.length}
                    placeholder="Grade"
                    value={grades[attempt.id] || ''}
                    onChange={e => setGrades(g => ({ ...g, [attempt.id]: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Remark (optional)"
                    value={remarkState[attempt.id] || ''}
                    onChange={e => setRemarkState(r => ({ ...r, [attempt.id]: e.target.value }))}
                  />
                  <Button onClick={() => handleGrade(attempt)} disabled={grading[attempt.id]}>Save Grade</Button>
                </div>
              </Card>
            );
          })
        )}
      </Card>
    </div>
  );
} 