
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, FileText, Calendar, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

// Mock data
const mockAssignments = [
  {
    id: '1',
    title: 'Physics Force and Motion Problems',
    subject: 'Physics',
    dueDate: new Date(2023, 5, 20),
    status: 'pending',
    progress: 0,
    description: 'Complete the problem set on forces and motion including Newton\'s laws applications.'
  },
  {
    id: '2',
    title: 'Algebra Equations Worksheet',
    subject: 'Mathematics',
    dueDate: new Date(2023, 5, 15),
    status: 'in-progress',
    progress: 65,
    description: 'Solve all the equations on the worksheet and show your work.'
  },
  {
    id: '3',
    title: 'English Literature Essay',
    subject: 'English',
    dueDate: new Date(2023, 5, 10),
    status: 'completed',
    progress: 100,
    description: 'Write a 1000-word analytical essay on the themes in "To Kill a Mockingbird".'
  },
  {
    id: '4',
    title: 'Chemistry Lab Report',
    subject: 'Chemistry',
    dueDate: new Date(2023, 5, 25),
    status: 'pending',
    progress: 0,
    description: 'Document the results of the acid-base titration lab and analyze the findings.'
  },
  {
    id: '5',
    title: 'History Research Project',
    subject: 'History',
    dueDate: new Date(2023, 5, 18),
    status: 'in-progress',
    progress: 30,
    description: 'Research and create a presentation on a significant historical event of your choice.'
  }
];

interface AssignmentCardProps {
  assignment: typeof mockAssignments[0];
  onClick: () => void;
}

const AssignmentCard = ({ assignment, onClick }: AssignmentCardProps) => {
  const { toast } = useToast();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'pending': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const handleUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Upload started",
      description: "Your assignment is being uploaded.",
    });
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <Badge className={getStatusColor(assignment.status)} variant="secondary">
              {assignment.status === 'in-progress' ? 'In Progress' : 
               assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
            </Badge>
            <CardTitle className="mt-2">{assignment.title}</CardTitle>
            <CardDescription>{assignment.subject}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground mb-4">{assignment.description}</p>
        <div className="space-y-4">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Due: {formatDate(assignment.dueDate)}</span>
          </div>
          {(assignment.status === 'in-progress' || assignment.status === 'completed') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{assignment.progress}%</span>
              </div>
              <Progress value={assignment.progress} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-1" />
            View Details
          </Button>
          {assignment.status !== 'completed' && (
            <Button size="sm" onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-1" />
              Submit
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const AssignmentList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const navigate = useNavigate();

  const filteredAssignments = mockAssignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || assignment.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAssignmentClick = (assignmentId: string) => {
    navigate(`/assignments/${assignmentId}`);
  };

  const pendingCount = mockAssignments.filter(a => a.status === 'pending').length;
  const inProgressCount = mockAssignments.filter(a => a.status === 'in-progress').length;
  const completedCount = mockAssignments.filter(a => a.status === 'completed').length;

  return (
    <div className="container mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Assignments</h1>
          <p className="text-gray-600">Manage and track your assignments</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Input
              type="search"
              placeholder="Search assignments..."
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

      {/* Assignment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-700 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700">{pendingCount}</p>
            <p className="text-sm text-amber-600">Assignments pending submission</p>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-700 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{inProgressCount}</p>
            <p className="text-sm text-blue-600">Assignments being worked on</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-700 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{completedCount}</p>
            <p className="text-sm text-green-600">Assignments submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Tabs */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setSelectedStatus('all')}>All</TabsTrigger>
          <TabsTrigger value="pending" onClick={() => setSelectedStatus('pending')}>Pending</TabsTrigger>
          <TabsTrigger value="in-progress" onClick={() => setSelectedStatus('in-progress')}>In Progress</TabsTrigger>
          <TabsTrigger value="completed" onClick={() => setSelectedStatus('completed')}>Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map(assignment => (
                <AssignmentCard 
                  key={assignment.id}
                  assignment={assignment}
                  onClick={() => handleAssignmentClick(assignment.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No assignments found</h3>
              <p className="text-muted-foreground mb-4">There are no assignments that match your criteria.</p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
              }}>Clear filters</Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          {/* Similar content to 'all' tab but filtered for pending */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map(assignment => (
              <AssignmentCard 
                key={assignment.id}
                assignment={assignment}
                onClick={() => handleAssignmentClick(assignment.id)}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="in-progress" className="mt-6">
          {/* Similar content to 'all' tab but filtered for in-progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map(assignment => (
              <AssignmentCard 
                key={assignment.id}
                assignment={assignment}
                onClick={() => handleAssignmentClick(assignment.id)}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {/* Similar content to 'all' tab but filtered for completed */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map(assignment => (
              <AssignmentCard 
                key={assignment.id}
                assignment={assignment}
                onClick={() => handleAssignmentClick(assignment.id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssignmentList;
