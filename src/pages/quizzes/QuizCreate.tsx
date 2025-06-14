import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase, sendNotifications } from '../../integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';

const defaultQuestion = {
  question_text: '',
  answer_type: 'option', // 'option' or 'text'
  options: '', // comma-separated
  correct_option: 0,
  correct_text_answer: '',
};

export default function QuizCreate() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [attemptDuration, setAttemptDuration] = useState(30);
  const [questions, setQuestions] = useState([{ ...defaultQuestion }]);
  const [saving, setSaving] = useState(false);
  const [assignedCourses, setAssignedCourses] = useState<{ id: string; name: string }[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const navigate = useNavigate();

  // Only allow teachers
  if (profile?.role !== 'teacher') {
    navigate('/quizzes');
    return null;
  }

  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', user.id);
      if (!error && data) {
        setAssignedCourses(
          data.map((course: any) => ({
            id: course.id,
            name: course.title,
          }))
        );
      }
      setLoadingCourses(false);
    };
    fetchCourses();
  }, []);

  const handleQuestionChange = (idx: number, field: string, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      // Reset options/correct_option if answer_type changes
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
    if (scheduledAt) {
      scheduledAtUTC = new Date(scheduledAt).toISOString();
    }
    // 1. Insert quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([{
        course_id: courseId,
        created_by: user.id,
        title,
        scheduled_at: scheduledAtUTC,
        attempt_duration: attemptDuration,
        status: 'scheduled'
      }])
      .select()
      .single();

    if (quizError || !quiz) {
      setSaving(false);
      alert('Failed to create quiz: ' + (quizError?.message || 'Unknown error'));
      return;
    }

    // 2. Insert questions
    const questionsToInsert = questions.map(q => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      answer_type: q.answer_type,
      options: q.answer_type === 'option' ? q.options : null,
      correct_option: q.answer_type === 'option' ? q.correct_option : null,
      correct_text_answer: q.answer_type === 'text' ? q.correct_text_answer : null,
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    setSaving(false);

    if (questionsError) {
      alert('Quiz created, but failed to add questions: ' + questionsError.message);
      return;
    }

    // Send notifications to students and admins
    // 1. Get enrolled students for the course
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('course_id', courseId);
    const studentIds = enrollments ? enrollments.map((e: any) => e.student_id) : [];
    if (studentIds.length > 0) {
      await sendNotifications(
        studentIds,
        'New Quiz',
        `A new quiz "${title}" has been added to your course.`,
        'quiz',
        '/quizzes'
      );
    }
    // 2. Get all admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'admin');
    const adminIds = admins ? admins.map((a: any) => a.id) : [];
    if (adminIds.length > 0) {
      await sendNotifications(
        adminIds,
        'New Quiz Added',
        `A new quiz has been added by ${profile?.name || 'a teacher'}.`,
        'quiz',
        '/quizzes'
      );
    }

    // Success!
    toast({ title: 'Quiz created', description: 'Quiz created successfully!' });
    navigate('/quizzes');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Create Quiz</h2>
        <div className="mb-4">
          <Label htmlFor="course">Course</Label>
          {loadingCourses ? (
            <div>Loading courses...</div>
          ) : (
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger id="course">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {assignedCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="mb-4">
          <Label htmlFor="title">Quiz Title</Label>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
            <Input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
          </div>
          <div className="flex-1">
            <Label htmlFor="duration">Attempt Duration (min)</Label>
            <Input id="duration" type="number" min={1} value={attemptDuration} onChange={e => setAttemptDuration(Number(e.target.value))} />
          </div>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Questions</h3>
          {questions.map((q, idx) => (
            <Card key={idx} className="p-4 mb-4 bg-gray-50">
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
                        {q.options.split(',').map((opt, i) => (
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
          <Button variant="destructive" onClick={() => navigate('/quizzes')}>Discard</Button>
        </div>
      </Card>
    </div>
  );
} 