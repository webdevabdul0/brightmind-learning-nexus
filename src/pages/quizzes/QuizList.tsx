import React, { useEffect, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useNavigate } from 'react-router-dom';

// import { useUser } from '../../hooks/useUser';
// TEMP: Placeholder user and role
const user = { id: 'test-user-id' };
const role = 'teacher'; // Change to 'student' or 'admin' to test different views

interface Quiz {
  id: string;
  title: string;
  scheduled_at: string;
  attempt_duration: number;
  status: string;
  course_id: string;
}

const QuizList: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  // const { user, role } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      let data, error;
      if (role === 'teacher') {
        ({ data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('created_by', user.id)
          .order('scheduled_at', { ascending: false }));
      } else if (role === 'student') {
        ({ data, error } = await supabase.rpc('get_student_quizzes', { student_id: user.id }));
      } else {
        ({ data, error } = await supabase
          .from('quizzes')
          .select('*')
          .order('scheduled_at', { ascending: false }));
      }
      if (!error && data) setQuizzes(data);
      setLoading(false);
    };
    fetchQuizzes();
  }, []);

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
            quizzes.map((quiz) => (
              <Card key={quiz.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-lg">{quiz.title}</div>
                  <div className="text-sm text-gray-500">Scheduled: {new Date(quiz.scheduled_at).toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Duration: {quiz.attempt_duration} min</div>
                  <div className="text-sm text-gray-500">Status: {quiz.status}</div>
                </div>
                <div className="mt-2 md:mt-0 flex gap-2">
                  {role === 'teacher' && (
                    <Button variant="outline" onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}>Edit</Button>
                  )}
                  {role === 'student' && (
                    <Button onClick={() => navigate(`/quizzes/${quiz.id}/attempt`)}>Attempt</Button>
                  )}
                  {role === 'admin' && (
                    <Button variant="outline" onClick={() => navigate(`/quizzes/${quiz.id}`)}>View</Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default QuizList; 