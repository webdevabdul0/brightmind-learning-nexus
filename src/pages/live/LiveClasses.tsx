import { useState } from 'react';
import { Calendar, Search, Video, Users, MessageSquare, Clock, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Helper to determine status (move to module scope)
const getStatus = (session) => {
  const now = new Date();
  const start = new Date(session.start_time);
  const end = new Date(start.getTime() + (session.duration || 0) * 60000);
  if (now < start) return 'scheduled';
  if (now >= start && now <= end) return 'ongoing';
  return 'completed';
};

const LiveClasses = () => {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch live classes from Supabase
  const { data: liveClasses = [], isLoading } = useQuery({
    queryKey: ['liveClasses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_classes')
        .select(`*, instructor:instructor_id(name), course:courses(title)`)
        .order('start_time', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const filteredSessions = liveClasses.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.instructor?.name && session.instructor.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (session.course?.title && session.course.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing': return 'bg-green-500 text-white';
      case 'scheduled': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleEdit = (session: any) => {
    alert('Edit live class: ' + session.title);
  };
  const handleDelete = (id: string) => {
    alert('Delete live class: ' + id);
  };

  return (
    <div className="container mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Live Classes</h1>
          <p className="text-gray-600">Join interactive live sessions with top instructors</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Input
              type="search"
              placeholder="Search live sessions..."
              className="w-full md:w-[300px] pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
          </div>
          <Button variant="default">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="mb-8">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="past">Past Sessions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions
              .filter(session => getStatus(session) === 'scheduled')
              .map(session => (
                <LiveClassCard key={session.id} session={session} handleEdit={handleEdit} handleDelete={handleDelete} />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="ongoing" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions
              .filter(session => getStatus(session) === 'ongoing')
              .map(session => (
                <LiveClassCard key={session.id} session={session} handleEdit={handleEdit} handleDelete={handleDelete} />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions
              .filter(session => getStatus(session) === 'completed')
              .map(session => (
                <LiveClassCard key={session.id} session={session} handleEdit={handleEdit} handleDelete={handleDelete} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface LiveClassCardProps {
  session: any;
  handleEdit?: (session: any) => void;
  handleDelete?: (id: string) => void;
}

const LiveClassCard = ({ session, handleEdit, handleDelete }: LiveClassCardProps) => {
  const { user, profile } = useAuth();
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-500 text-white';
      case 'scheduled': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const status = getStatus(session);
  const handleJoin = () => {
    if (session.meeting_url) {
      window.open(session.meeting_url, '_blank');
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md bg-card text-card-foreground border border-border">
      <CardHeader className="pb-2 bg-background">
        <div className="flex justify-between items-start">
          <div>
            <Badge className={getStatusColor(status)} variant="secondary">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            <CardTitle className="mt-2">{session.title}</CardTitle>
            <CardDescription>{session.instructor?.name || ''}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 bg-background">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{formatDate(new Date(session.start_time))}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{session.duration}</span>
          </div>
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{session.participants} participants</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-background">
        <div className="flex justify-between w-full items-center">
          <div className="flex gap-2">
          
            {profile?.role === 'teacher' && user?.id === session.instructor_id && (
              <>
                <Button variant="ghost" size="icon" onClick={() => handleEdit && handleEdit(session)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete && handleDelete(session.id)}><Trash className="h-4 w-4 text-red-500" /></Button>
              </>
            )}
          </div>
          {status === 'ongoing' || status === 'scheduled' ? (
            <Button size="sm" onClick={handleJoin} disabled={!session.meeting_url}>
              {status === 'ongoing' ? (
                <>
                  <Video className="h-4 w-4 mr-1" />
                  Join Now
                </>
              ) : (
                'Attend'
              )}
            </Button>
          ) : (
            <Button size="sm" disabled>
              View Recording
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default LiveClasses;
