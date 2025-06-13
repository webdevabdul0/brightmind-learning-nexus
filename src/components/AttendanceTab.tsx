import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface AttendanceTabProps {
  courseId: string | undefined;
}

type Student = {
  id: string;
  name: string;
  email: string;
};

type AttendanceStatus = 'present' | 'absent';

type AttendanceRecord = {
  student_id: string;
  status: AttendanceStatus;
};

interface StudentAttendanceViewProps {
  courseId: string | undefined;
  userId: string | undefined;
}

export const AttendanceTab = ({ courseId }: AttendanceTabProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get today's date in YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    // Fetch enrolled students
    supabase
      .from('enrollments')
      .select('student:student_id(id, name, email)')
      .eq('course_id', courseId)
      .then(async ({ data, error }) => {
        if (error) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
          setLoading(false);
          return;
        }
        const studentsList = data.map((e: any) => e.student);
        setStudents(studentsList);
        // Fetch existing attendance for today
        const { data: attendanceData } = await supabase
          .from('attendance_records')
          .select('student_id, status')
          .eq('course_id', courseId)
          .eq('date', today);
        const attendanceMap: Record<string, AttendanceStatus> = {};
        (attendanceData || []).forEach((rec: any) => {
          attendanceMap[rec.student_id] = rec.status;
        });
        setAttendance(attendanceMap);
        setLoading(false);
      });
  }, [courseId]);

  const handleToggle = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const allMarked: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      allMarked[s.id] = status;
    });
    setAttendance(allMarked);
  };

  const handleSave = async () => {
    setSaving(true);
    // Upsert attendance records for today
    const records = students.map(s => ({
      course_id: courseId,
      student_id: s.id,
      date: today,
      status: attendance[s.id] || 'absent',
    }));
    // Delete existing for today, then insert new (to avoid duplicates)
    await supabase
      .from('attendance_records')
      .delete()
      .eq('course_id', courseId)
      .eq('date', today);
    const { error } = await supabase
      .from('attendance_records')
      .insert(records);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Attendance Saved', description: 'Attendance has been saved for today.' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button size="sm" variant="outline" onClick={() => handleMarkAll('present')}>Mark All Present</Button>
        <Button size="sm" variant="outline" onClick={() => handleMarkAll('absent')}>Mark All Absent</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-4 text-left">Student</th>
              <th className="py-2 px-4 text-left">Email</th>
              <th className="py-2 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} className="border-t">
                <td className="py-2 px-4">{student.name}</td>
                <td className="py-2 px-4">{student.email}</td>
                <td className="py-2 px-4 text-center">
                  <Button
                    size="sm"
                    variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                    className={attendance[student.id] === 'present' ? 'bg-green-500 text-white' : 'bg-gray-100'}
                    onClick={() => handleToggle(student.id)}
                  >
                    {attendance[student.id] === 'present' ? 'Present' : 'Absent'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button className="mt-6" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Attendance'}</Button>
    </div>
  );
};

export const StudentAttendanceView = ({ courseId, userId }: StudentAttendanceViewProps) => {
  const [records, setRecords] = useState<{ date: string; status: AttendanceStatus }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId || !userId) return;
    setLoading(true);
    supabase
      .from('attendance_records')
      .select('date, status')
      .eq('course_id', courseId)
      .eq('student_id', userId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setRecords([]);
        } else {
          setRecords(data || []);
        }
        setLoading(false);
      });
  }, [courseId, userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const percent = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="mb-4">
        <div className="text-lg font-semibold mb-1">Attendance Overview</div>
        <div className="flex gap-4 items-center">
          <span className="text-green-600 font-bold">Present: {present}</span>
          <span className="text-red-600 font-bold">Absent: {absent}</span>
          <span className="font-bold">Attendance: {percent}%</span>
        </div>
      </div>
      <div>
        <div className="font-medium mb-2">Daily Attendance</div>
        <table className="min-w-full bg-white rounded">
          <thead>
            <tr>
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.date} className="border-t">
                <td className="py-2 px-4">{r.date}</td>
                <td className="py-2 px-4 text-center">
                  {r.status === 'present' ? (
                    <span className="text-green-600 font-semibold">Present</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Absent</span>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={2} className="text-center py-4 text-gray-500">No attendance records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 