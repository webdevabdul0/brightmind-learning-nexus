
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Video, 
  FileText, 
  CheckCircle2, 
  Clock,
  Users,
  PlayCircle,
  Download,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mock course data
const mockCourses = {
  '1': {
    id: '1',
    title: 'Introduction to Physics',
    description: 'A comprehensive introduction to physics for O Level students. This course covers mechanics, energy, thermal physics, waves, electricity and magnetism.',
    instructor: 'Dr. Sarah Johnson',
    instructorImage: '',
    category: 'Science',
    progress: 60,
    totalLessons: 12,
    completedLessons: 7,
    duration: '6 weeks',
    students: 345,
    color: 'bg-brightmind-purple text-white',
    modules: [
      {
        id: 'm1',
        title: 'Introduction to Physics Concepts',
        lessons: [
          { id: 'l1', title: 'What is Physics?', duration: '15 min', type: 'video', completed: true },
          { id: 'l2', title: 'Scientific Method', duration: '10 min', type: 'video', completed: true }
        ]
      },
      {
        id: 'm2',
        title: 'Kinematics',
        lessons: [
          { id: 'l3', title: 'Distance and Displacement', duration: '20 min', type: 'video', completed: true },
          { id: 'l4', title: 'Speed and Velocity', duration: '25 min', type: 'video', completed: false },
          { id: 'l5', title: 'Acceleration', duration: '15 min', type: 'video', completed: false }
        ]
      },
      {
        id: 'm3',
        title: 'Forces and Motion',
        lessons: [
          { id: 'l6', title: 'Newton\'s Laws of Motion', duration: '30 min', type: 'video', completed: false },
          { id: 'l7', title: 'Force and Acceleration Practice', duration: '20 min', type: 'quiz', completed: false }
        ]
      }
    ],
    assignments: [
      { id: 'a1', title: 'Physics Fundamentals Quiz', dueDate: '2023-06-15', completed: true },
      { id: 'a2', title: 'Kinematics Problem Set', dueDate: '2023-06-22', completed: false },
      { id: 'a3', title: 'Forces Lab Report', dueDate: '2023-06-29', completed: false }
    ]
  },
  '2': {
    id: '2',
    title: 'Advanced Mathematics for O Levels',
    description: 'Master advanced mathematics topics required for O Level exams. This course covers algebra, trigonometry, calculus fundamentals, and more.',
    instructor: 'Prof. Michael Chen',
    instructorImage: '',
    category: 'Mathematics',
    progress: 50,
    totalLessons: 10,
    completedLessons: 5,
    duration: '8 weeks',
    students: 412,
    color: 'bg-brightmind-blue text-white',
    modules: [
      {
        id: 'm1',
        title: 'Advanced Algebra',
        lessons: [
          { id: 'l1', title: 'Polynomial Functions', duration: '25 min', type: 'video', completed: true },
          { id: 'l2', title: 'Rational Expressions', duration: '20 min', type: 'video', completed: true }
        ]
      },
      {
        id: 'm2',
        title: 'Trigonometry',
        lessons: [
          { id: 'l3', title: 'Sine and Cosine Rules', duration: '30 min', type: 'video', completed: true },
          { id: 'l4', title: 'Trigonometric Identities', duration: '25 min', type: 'video', completed: false }
        ]
      }
    ],
    assignments: [
      { id: 'a1', title: 'Algebra Test', dueDate: '2023-07-05', completed: true },
      { id: 'a2', title: 'Trigonometry Problems', dueDate: '2023-07-15', completed: false }
    ]
  }
};

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const course = mockCourses[courseId as keyof typeof mockCourses];
  const [currentTab, setCurrentTab] = useState('content');

  if (!course) {
    return <div className="p-8 text-center">Course not found</div>;
  }

  return (
    <div className="container mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link to="/courses" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Link>
        
        <div className={`${course.color} rounded-xl p-8`}>
          <div className="flex flex-col lg:flex-row justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
              <div className="flex items-center mb-4">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={course.instructorImage || "/placeholder.svg"} />
                  <AvatarFallback>{course.instructor.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{course.instructor}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">{course.category}</Badge>
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-4 w-4" />
                  <span>{course.students} students</span>
                </div>
              </div>
              
              <p className="max-w-2xl">{course.description}</p>
            </div>
            <div className="mt-6 lg:mt-0 lg:ml-6 lg:self-end">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg inline-block">
                <div className="text-center mb-3">
                  <p className="font-medium">Course Progress</p>
                  <div className="text-3xl font-bold">{course.progress}%</div>
                </div>
                <Progress value={course.progress} className="w-40 h-2" />
                <div className="mt-2 text-sm text-center">
                  {course.completedLessons} of {course.totalLessons} lessons completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-8">
        <TabsList className="mb-8">
          <TabsTrigger value="content">Course Content</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="animate-fade-in">
          <div className="space-y-6">
            {course.modules.map((module, index) => (
              <div key={module.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-secondary p-4">
                  <h3 className="font-semibold text-lg">Module {index + 1}: {module.title}</h3>
                </div>
                
                <div className="divide-y">
                  {module.lessons.map((lesson) => (
                    <div key={lesson.id} className="p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {lesson.type === 'video' ? (
                            <Video className="w-5 h-5 mr-3 text-brightmind-blue" />
                          ) : (
                            <FileText className="w-5 h-5 mr-3 text-brightmind-purple" />
                          )}
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">{lesson.title}</span>
                              {lesson.completed && (
                                <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>{lesson.duration}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button variant="ghost" size="sm">
                          <PlayCircle className="mr-1 h-4 w-4" />
                          {lesson.completed ? "Replay" : "Start"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="assignments" className="animate-fade-in">
          <div className="space-y-4">
            {course.assignments.map((assignment) => (
              <div 
                key={assignment.id} 
                className={`p-4 border rounded-lg flex items-center justify-between ${
                  assignment.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center">
                  <FileText className={`w-5 h-5 mr-3 ${assignment.completed ? "text-green-500" : "text-brightmind-purple"}`} />
                  <div>
                    <div className="font-medium">{assignment.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant={assignment.completed ? "outline" : "default"}
                  size="sm"
                >
                  {assignment.completed ? "View Submission" : "Submit Assignment"}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="resources" className="animate-fade-in">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-4">Course Materials</h3>
              <ul className="space-y-2">
                <li className="flex items-center justify-between p-2 hover:bg-muted/20 rounded">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-brightmind-blue" />
                    <span>Course Syllabus</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </li>
                <li className="flex items-center justify-between p-2 hover:bg-muted/20 rounded">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-brightmind-purple" />
                    <span>Practice Problems</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </li>
                <li className="flex items-center justify-between p-2 hover:bg-muted/20 rounded">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-brightmind-purple" />
                    <span>Formula Sheet</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="discussions" className="animate-fade-in">
          <div className="p-8 text-center bg-muted/20 rounded-lg">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Join the Discussion</h3>
            <p className="text-muted-foreground mb-4">Connect with other students and ask questions about this course.</p>
            <Button>Start a Discussion</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDetail;
