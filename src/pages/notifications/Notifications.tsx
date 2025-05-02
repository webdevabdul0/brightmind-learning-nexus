
import { useState } from 'react';
import { Bell, Check, Filter, Clock, BookOpen, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'course' | 'assignment' | 'announcement' | 'reminder';
  timestamp: Date;
  isRead: boolean;
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New assignment posted',
    message: 'A new Physics assignment has been posted. Due in 5 days.',
    type: 'assignment',
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    isRead: false
  },
  {
    id: '2',
    title: 'Live class starting soon',
    message: 'Your Physics Problem Solving session starts in 15 minutes.',
    type: 'reminder',
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    isRead: false
  },
  {
    id: '3',
    title: 'Assignment feedback',
    message: 'You received feedback on your Mathematics assignment.',
    type: 'assignment',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    isRead: true
  },
  {
    id: '4',
    title: 'New course material available',
    message: 'New study materials for Chemistry have been uploaded.',
    type: 'course',
    timestamp: new Date(Date.now() - 172800000), // 2 days ago
    isRead: true
  },
  {
    id: '5',
    title: 'Upcoming test reminder',
    message: 'Reminder: You have a Mathematics test scheduled for tomorrow.',
    type: 'reminder',
    timestamp: new Date(Date.now() - 259200000), // 3 days ago
    isRead: true
  },
  {
    id: '6',
    title: 'School announcement',
    message: 'Parent-teacher meeting scheduled for next Friday.',
    type: 'announcement',
    timestamp: new Date(Date.now() - 432000000), // 5 days ago
    isRead: true
  }
];

const NotificationCard = ({ notification, onMarkAsRead }: { notification: Notification, onMarkAsRead: () => void }) => {
  const { toast } = useToast();
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'assignment':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'announcement':
        return <Bell className="h-5 w-5 text-amber-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'course':
        return <Badge className="bg-blue-500">Course</Badge>;
      case 'assignment':
        return <Badge className="bg-purple-500">Assignment</Badge>;
      case 'announcement':
        return <Badge className="bg-amber-500">Announcement</Badge>;
      case 'reminder':
        return <Badge className="bg-red-500">Reminder</Badge>;
      default:
        return <Badge>Other</Badge>;
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead();
    toast({
      description: "Notification marked as read",
    });
  };

  return (
    <Card 
      className={`mb-4 overflow-hidden ${!notification.isRead ? 'border-l-4 border-l-brightmind-purple' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            {getTypeIcon(notification.type)}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-medium ${!notification.isRead ? 'text-brightmind-blue' : ''}`}>
                  {notification.title}
                </h3>
                <p className="text-muted-foreground mt-1">{notification.message}</p>
              </div>
              {!notification.isRead && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={handleMarkAsRead}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-muted-foreground">
                {formatTime(notification.timestamp)}
              </div>
              <div>
                {getTypeBadge(notification.type)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { toast } = useToast();

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    toast({
      description: "All notifications marked as read",
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    return matchesSearch && matchesType;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="container mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your courses and assignments</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Input
              type="search"
              placeholder="Search notifications..."
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

      {unreadCount > 0 && (
        <div className="flex justify-between items-center mb-6 bg-muted/30 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brightmind-purple" />
            <span>You have <strong>{unreadCount}</strong> unread notification{unreadCount !== 1 ? 's' : ''}</span>
          </div>
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-1" />
            Mark all as read
          </Button>
        </div>
      )}

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setFilterType('all')}>All</TabsTrigger>
          <TabsTrigger value="unread" onClick={() => setFilterType('all')}>
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="courses" onClick={() => setFilterType('course')}>Courses</TabsTrigger>
          <TabsTrigger value="assignments" onClick={() => setFilterType('assignment')}>Assignments</TabsTrigger>
          <TabsTrigger value="reminders" onClick={() => setFilterType('reminder')}>Reminders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {filteredNotifications.length > 0 ? (
            <div>
              {filteredNotifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No notifications found</h3>
              <p className="text-muted-foreground mb-4">There are no notifications that match your criteria.</p>
              <Button onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}>Clear filters</Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="unread" className="mt-6">
          {/* Content for unread tab */}
          <div>
            {filteredNotifications
              .filter(notification => !notification.isRead)
              .map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="courses" className="mt-6">
          {/* Content for courses tab */}
          <div>
            {filteredNotifications
              .filter(notification => notification.type === 'course')
              .map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="assignments" className="mt-6">
          {/* Content for assignments tab */}
          <div>
            {filteredNotifications
              .filter(notification => notification.type === 'assignment')
              .map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="reminders" className="mt-6">
          {/* Content for reminders tab */}
          <div>
            {filteredNotifications
              .filter(notification => notification.type === 'reminder')
              .map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications;
