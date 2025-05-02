
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, BookOpen, Clock, Users, Search, BellRing } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/providers/AuthProvider';
import StatCard from '@/components/dashboard/StatCard';
import CourseCard from '@/components/dashboard/CourseCard';
import { BarChart as ReBarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

// Mock data
const studyStatistics = [
  { day: 'MON', hours: 2.5 },
  { day: 'TUE', hours: 3.0 },
  { day: 'WED', hours: 4.5 },
  { day: 'THU', hours: 2.8 },
  { day: 'FRI', hours: 3.2 },
  { day: 'SAT', hours: 1.5 },
  { day: 'SUN', hours: 3.7 },
];

const mockCourses = [
  { 
    id: '1', 
    title: 'Introduction to Physics', 
    instructor: 'Dr. Sarah Johnson',
    color: 'bg-brightmind-lightpurple text-brightmind-purple', 
    progress: { completed: 7, total: 12 } 
  },
  { 
    id: '2', 
    title: 'Advanced Mathematics for O Levels', 
    instructor: 'Prof. Michael Chen',
    color: 'bg-brightmind-lightblue text-brightmind-blue', 
    progress: { completed: 5, total: 10 } 
  },
  { 
    id: '3', 
    title: 'English Literature Essentials', 
    instructor: 'Ms. Emily Parker',
    color: 'bg-blue-100 text-blue-600', 
    progress: { completed: 3, total: 8 } 
  }
];

const Dashboard = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="container mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || 'Student'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search courses..."
              className="w-[300px] pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
          </div>
          <Button size="icon" variant="ghost" className="relative">
            <BellRing className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <h2 className="text-xl font-semibold mb-4">OVERVIEW</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<BookOpen className="h-6 w-6 text-brightmind-blue" />}
          label="Courses in progress"
          value="3"
        />
        <StatCard 
          icon={<BookOpen className="h-6 w-6 text-brightmind-purple" />}
          label="Active Prototypes"
          value="7"
        />
        <StatCard 
          icon={<Clock className="h-6 w-6 text-brightmind-blue" />}
          label="Hours Learning"
          value="3h 15m"
        />
        <StatCard 
          icon={<Users className="h-6 w-6 text-brightmind-purple" />}
          label="Community score"
          value="240"
        />
      </div>

      {/* Study Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">STUDY STATISTICS</h3>
            <Tabs defaultValue="week">
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={studyStatistics}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar
                  dataKey="hours"
                  fill="#0EA5E9"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-6">PROGRESS</h3>
          <div className="flex justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="10"
                />
                
                {/* Progress circle - Courses (45%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#0EA5E9"
                  strokeWidth="10"
                  strokeDasharray="283"
                  strokeDashoffset="155"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                
                {/* Progress circle - Prototypes (80%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="#9b87f5"
                  strokeWidth="10"
                  strokeDasharray="220"
                  strokeDashoffset="44"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-3xl font-bold">45%</div>
                <div className="text-sm text-gray-500">overall</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center gap-8">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-brightmind-blue mr-2"></div>
              <span className="text-sm">Courses</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-brightmind-purple mr-2"></div>
              <span className="text-sm">Prototypes</span>
            </div>
          </div>
        </div>
      </div>

      {/* My Courses */}
      <h2 className="text-xl font-semibold mb-4">MY COURSES</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {mockCourses.map(course => (
          <CourseCard 
            key={course.id}
            {...course}
            onClick={() => handleCourseClick(course.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
