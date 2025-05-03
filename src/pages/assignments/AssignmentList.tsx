
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, FileText, Calendar, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface AssignmentCardProps {
  assignment: any;
  onClick: () => void;
  onUpload: (e: React.MouseEvent, assignmentId: string) => void;
}

const AssignmentCard = ({ assignment, onClick, onUpload }: AssignmentCardProps) => {
  const { toast } = useToast();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'pending': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
            <CardDescription>{assignment.course?.title || 'General'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground mb-4">{assignment.description}</p>
        <div className="space-y-4">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Due: {formatDate(assignment.due_date)}</span>
          </div>
          {(assignment.status === 'in-progress' || assignment.status === 'completed') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{assignment.progress || 0}%</span>
              </div>
              <Progress value={assignment.progress || 0} className="h-2" />
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
            <Button 
              size="sm" 
              onClick={(e) => onUpload(e, assignment.id)}
            >
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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          course:courses(id, title)
        `)
        .order('due_date');
        
      if (error) {
        toast({
          title: "Error fetching assignments",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      // Fetch submission status for each assignment
      const assignmentsWithStatus = await Promise.all(
        data.map(async (assignment) => {
          const { data: submission } = await supabase
            .from('assignment_submissions')
            .select('*')
            .eq('assignment_id', assignment.id)
            .eq('student_id', user.id)
            .single();
          
          let status = 'pending';
          let progress = 0;
          
          if (submission) {
            status = submission.status;
            progress = status === 'completed' ? 100 : 
                      status === 'in-progress' ? 65 : 0;
          }
          
          return {
            ...assignment,
            status,
            progress
          };
        })
      );
      
      return assignmentsWithStatus;
    },
    enabled: !!user
  });

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (assignment.course?.title && assignment.course.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || assignment.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAssignmentClick = (assignmentId: string) => {
    navigate(`/assignments/${assignmentId}`);
  };

  const handleUpload = (e: React.MouseEvent, assignmentId: string) => {
    e.stopPropagation();
    toast({
      title: "Upload started",
      description: "Your assignment is being uploaded.",
    });
  };

  const pendingCount = assignments.filter(a => a.status === 'pending').length;
  const inProgressCount = assignments.filter(a => a.status === 'in-progress').length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;

  // Render skeleton loaders
  const renderSkeletons = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
      <div key={i} className="rounded-xl p-6 bg-slate-100">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="container mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Assignments</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
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
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons(6)}
            </div>
          ) : filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map(assignment => (
                <AssignmentCard 
                  key={assignment.id}
                  assignment={assignment}
                  onClick={() => handleAssignmentClick(assignment.id)}
                  onUpload={handleUpload}
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
        
        {/* Content for other tabs is similar but filtered, using the same components */}
        <TabsContent value="pending" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons(3)}
            </div>
          ) : filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map(assignment => (
                <AssignmentCard 
                  key={assignment.id}
                  assignment={assignment}
                  onClick={() => handleAssignmentClick(assignment.id)}
                  onUpload={handleUpload}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pending assignments</h3>
              <p className="text-muted-foreground mb-4">You don't have any pending assignments at the moment.</p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
              }}>View all assignments</Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="in-progress" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons(2)}
            </div>
          ) : filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map(assignment => (
                <AssignmentCard 
                  key={assignment.id}
                  assignment={assignment}
                  onClick={() => handleAssignmentClick(assignment.id)}
                  onUpload={handleUpload}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No in-progress assignments</h3>
              <p className="text-muted-foreground mb-4">You don't have any assignments in progress.</p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
              }}>View all assignments</Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons(2)}
            </div>
          ) : filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map(assignment => (
                <AssignmentCard 
                  key={assignment.id}
                  assignment={assignment}
                  onClick={() => handleAssignmentClick(assignment.id)}
                  onUpload={handleUpload}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No completed assignments</h3>
              <p className="text-muted-foreground mb-4">You haven't completed any assignments yet.</p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
              }}>View all assignments</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssignmentList;
