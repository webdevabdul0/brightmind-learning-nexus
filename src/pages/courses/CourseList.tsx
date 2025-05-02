
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import CourseCard from '@/components/dashboard/CourseCard';

// Mock data
const mockCourses = [
  { 
    id: '1', 
    title: 'Introduction to Physics', 
    instructor: 'Dr. Sarah Johnson',
    color: 'bg-brightmind-lightpurple text-brightmind-purple', 
    progress: { completed: 7, total: 12 },
    category: 'Science'
  },
  { 
    id: '2', 
    title: 'Advanced Mathematics for O Levels', 
    instructor: 'Prof. Michael Chen',
    color: 'bg-brightmind-lightblue text-brightmind-blue', 
    progress: { completed: 5, total: 10 },
    category: 'Mathematics'
  },
  { 
    id: '3', 
    title: 'English Literature Essentials', 
    instructor: 'Ms. Emily Parker',
    color: 'bg-blue-100 text-blue-600', 
    progress: { completed: 3, total: 8 },
    category: 'Languages'
  },
  { 
    id: '4', 
    title: 'Chemistry Foundations', 
    instructor: 'Dr. James Wilson',
    color: 'bg-green-100 text-green-600', 
    progress: { completed: 2, total: 10 },
    category: 'Science'
  },
  { 
    id: '5', 
    title: 'World History Overview', 
    instructor: 'Prof. Linda Thompson',
    color: 'bg-amber-100 text-amber-600', 
    progress: { completed: 4, total: 8 },
    category: 'Humanities'
  },
  { 
    id: '6', 
    title: 'Computer Science Basics', 
    instructor: 'Mr. Robert Davis',
    color: 'bg-indigo-100 text-indigo-600', 
    progress: { completed: 6, total: 12 },
    category: 'Computer Science'
  }
];

const categories = [
  'All',
  'Mathematics',
  'Science',
  'Languages',
  'Humanities',
  'Computer Science'
];

const CourseList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="container mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Course Catalog</h1>
          <p className="text-gray-600">Browse and discover courses to enhance your learning</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Input
              type="search"
              placeholder="Search courses..."
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

      {/* Tabs for categories */}
      <div className="mb-6 overflow-auto pb-2">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer px-4 py-2"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tabs for enrolled vs all courses */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="enrolled">Enrolled Courses</TabsTrigger>
          <TabsTrigger value="all">All Courses</TabsTrigger>
        </TabsList>
        <TabsContent value="enrolled" className="mt-6">
          {filteredCourses.slice(0, 3).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.slice(0, 3).map(course => (
                <CourseCard 
                  key={course.id}
                  {...course}
                  onClick={() => handleCourseClick(course.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No enrolled courses found</h3>
              <p className="text-muted-foreground mb-4">You don't have any enrolled courses that match your search.</p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}>Clear filters</Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="all" className="mt-6">
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <CourseCard 
                  key={course.id}
                  {...course}
                  onClick={() => handleCourseClick(course.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">We couldn't find any courses that match your search.</p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}>Clear filters</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseList;
