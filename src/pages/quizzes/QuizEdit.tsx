import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Label } from '../../components/ui/label';

const defaultQuestion = {
  question_text: '',
  answer_type: 'option',
  options: '',
  correct_option: 0,
  correct_text_answer: '',
};

export default function QuizEdit() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.role !== 'teacher') {
      navigate('/quizzes');
      return;
    }
    const fetchQuiz = async () => {
      setLoading(true);
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
      setQuiz(quizData);
      const { data: questionData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id);
      setQuestions(
        (questionData || []).map(q => ({
          ...q,
          options: q.options || '',
          correct_option: q.correct_option ?? 0,
          correct_text_answer: q.correct_text_answer || '',
        }))
      );
      setLoading(false);
    };
    fetchQuiz();
  }, [id, profile, navigate, toast]);

  const handleQuestionChange = (idx: number, field: string, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'answer_type') {
        if (value === 'option') {
          updated[idx].options = '';
          updated[idx].correct_option = 0;
        } else {
          updated[idx].options = '';
          updated[idx].correct_option = undefined;
        }
      }
      return updated;
    });
  };

  const addQuestion = () => setQuestions((prev) => [...prev, { ...defaultQuestion }]);
  const removeQuestion = (idx: number) => setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    // Convert local datetime to UTC ISO string
    let scheduledAtUTC = '';
    if (quiz.scheduled_at) {
      const localDate = new Date(quiz.scheduled_at);
      scheduledAtUTC = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString();
    }
    // Update quiz
    const { error: quizError } = await supabase
      .from('quizzes')
      .update({
        title: quiz.title,
        scheduled_at: scheduledAtUTC,
        attempt_duration: quiz.attempt_duration,
        status: quiz.status,
      })
      .eq('id', id);
    if (quizError) {
      toast({ title: 'Error', description: 'Failed to update quiz.' });
      setSaving(false);
      return;
    }
    // Upsert questions
    for (const q of questions) {
      if (q.id) {
        // Update existing
        await supabase.from('quiz_questions').update({
          question_text: q.question_text,
          answer_type: q.answer_type,
          options: q.answer_type === 'option' ? q.options : null,
          correct_option: q.answer_type === 'option' ? q.correct_option : null,
          correct_text_answer: q.answer_type === 'text' ? q.correct_text_answer : null,
        }).eq('id', q.id);
      } else {
        // Insert new
        await supabase.from('quiz_questions').insert({
          quiz_id: id,
          question_text: q.question_text,
          answer_type: q.answer_type,
          options: q.answer_type === 'option' ? q.options : null,
          correct_option: q.answer_type === 'option' ? q.correct_option : null,
          correct_text_answer: q.answer_type === 'text' ? q.correct_text_answer : null,
        });
      }
    }
    toast({ title: 'Quiz updated', description: 'Quiz updated successfully!' });
    setSaving(false);
    navigate('/quizzes');
  };

  if (loading || !quiz) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Edit Quiz</h2>
        <div className="mb-4">
          <Label htmlFor="title">Quiz Title</Label>
          <Input id="title" value={quiz.title} onChange={e => setQuiz({ ...quiz, title: e.target.value })} />
        </div>
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
            <Input id="scheduledAt" type="datetime-local" value={quiz.scheduled_at} onChange={e => setQuiz({ ...quiz, scheduled_at: e.target.value })} />
          </div>
          <div className="flex-1">
            <Label htmlFor="duration">Attempt Duration (min)</Label>
            <Input id="duration" type="number" min={1} value={quiz.attempt_duration} onChange={e => setQuiz({ ...quiz, attempt_duration: Number(e.target.value) })} />
          </div>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Questions</h3>
          {questions.map((q, idx) => (
            <Card key={q.id || idx} className="p-4 mb-4 bg-gray-50">
              <div className="mb-2 flex justify-between items-center">
                <Label>Question {idx + 1}</Label>
                {questions.length > 1 && (
                  <Button variant="destructive" size="sm" onClick={() => removeQuestion(idx)}>Remove</Button>
                )}
              </div>
              <Textarea
                className="mb-2"
                placeholder="Enter question text"
                value={q.question_text}
                onChange={e => handleQuestionChange(idx, 'question_text', e.target.value)}
              />
              <div className="mb-2">
                <Label>Answer Type</Label>
                <Select
                  value={q.answer_type}
                  onValueChange={val => handleQuestionChange(idx, 'answer_type', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option">Option Based</SelectItem>
                    <SelectItem value="text">Text Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {q.answer_type === 'option' ? (
                <>
                  <div className="mb-2">
                    <Label>Options (comma separated)</Label>
                    <Input
                      placeholder="Option 1, Option 2, Option 3, Option 4"
                      value={q.options}
                      onChange={e => handleQuestionChange(idx, 'options', e.target.value)}
                    />
                  </div>
                  <div className="mb-2">
                    <Label>Correct Option</Label>
                    <Select
                      value={q.correct_option?.toString() || '0'}
                      onValueChange={val => handleQuestionChange(idx, 'correct_option', Number(val))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {q.options.split(',').map((opt: string, i: number) => (
                          <SelectItem key={i} value={i.toString()}>{opt.trim() || `Option ${i + 1}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="mb-2">
                  <Label>Correct Answer (for auto-grading, optional)</Label>
                  <Input
                    placeholder="Enter correct answer (optional)"
                    value={q.correct_text_answer}
                    onChange={e => handleQuestionChange(idx, 'correct_text_answer', e.target.value)}
                  />
                </div>
              )}
            </Card>
          ))}
          <Button variant="outline" onClick={addQuestion}>Add Another Question</Button>
        </div>
        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} disabled={saving}>Save</Button>
          <Button variant="outline" onClick={() => navigate('/quizzes')}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
} 