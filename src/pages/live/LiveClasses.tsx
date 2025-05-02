
import { useState } from 'react';
import { Calendar, Search, Video, Users, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LiveSession {
  id: string;
  title: string;
  instructor: string;
  subject: string;
  date: Date;
  duration: string;
  participants: number;
  status: 'scheduled' | 'ongoing' | 'completed';
}

const mockLiveSessions: LiveSession[] = [
  {
    id: '1',
    title: 'Physics Problem Solving Session',
    instructor: 'Dr. Sarah Johnson',
    subject: 'Physics',
    date: new Date(2023, 5, 15, 10, 0), // June 15, 2023, 10:00 AM
    duration: '60 min',
    participants: 45,
    status: 'scheduled'
  },
  {
    id: '2',
    title: 'Mathematics Formula Mastery',
    instructor: 'Prof. Michael Chen',
    subject: 'Mathematics',
    date: new Date(2023, 5, 12, 14, 30), // June 12, 2023, 2:30 PM
    duration: '90 min',
    participants: 32,
    status: 'ongoing'
  },
  {
    id: '3',
    title: 'English Literature Analysis',
    instructor: 'Ms. Emily Parker',
    subject: 'English',
    date: new Date(2023, 5, 10, 11, 0), // June 10, 2023, 11:00 AM
    duration: '75 min',
    participants: 38,
    status: 'completed'
  },
  {
    id: '4',
    title: 'Chemistry Laboratory Techniques',
    instructor: 'Dr. James Wilson',
    subject: 'Chemistry',
    date: new Date(2023, 5, 18, 15, 0), // June 18, 2023, 3:00 PM
    duration: '120 min',
    participants: 28,
    status: 'scheduled'
  }
];

const LiveClasses = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = mockLiveSessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.subject.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
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
              .filter(session => session.status === 'scheduled')
              .map(session => (
                <LiveClassCard key={session.id} session={session} />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="ongoing" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions
              .filter(session => session.status === 'ongoing')
              .map(session => (
                <LiveClassCard key={session.id} session={session} />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions
              .filter(session => session.status === 'completed')
              .map(session => (
                <LiveClassCard key={session.id} session={session} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface LiveClassCardProps {
  session: LiveSession;
}

const LiveClassCard = ({ session }: LiveClassCardProps) => {
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
      case 'ongoing': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <Badge className={getStatusColor(session.status)} variant="secondary">
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </Badge>
            <CardTitle className="mt-2">{session.title}</CardTitle>
            <CardDescription>{session.instructor}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{formatDate(session.date)}</span>
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
      <CardFooter>
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-1" />
            Remind Me
          </Button>
          <Button size="sm" className={session.status === 'completed' ? 'bg-gray-500' : ''}>
            {session.status === 'ongoing' ? (
              <>
                <Video className="h-4 w-4 mr-1" />
                Join Now
              </>
            ) : session.status === 'scheduled' ? (
              'Register'
            ) : (
              'View Recording'
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LiveClasses;
