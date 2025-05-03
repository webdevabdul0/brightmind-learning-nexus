
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Loader2, RefreshCw, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Notifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        toast({
          title: "Error fetching notifications",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      return data;
    },
    enabled: !!user
  });
  
  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update notification",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast({
        title: "All notifications marked as read",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update notifications",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast({
        title: "Notification deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete notification",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.type === activeTab;
  });
  
  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // Group notifications by type
  const courseNotifications = notifications.filter(notification => notification.type === 'course');
  const assignmentNotifications = notifications.filter(notification => notification.type === 'assignment');
  const systemNotifications = notifications.filter(notification => notification.type === 'system');
  
  // Format notification date
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Get notification badge color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'course': return 'bg-blue-100 text-blue-800';
      case 'assignment': return 'bg-amber-100 text-amber-800';
      case 'system': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Notification skeleton loader
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, i) => (
      <div key={i} className="p-4 border-b last:border-b-0">
        <div className="flex justify-between">
          <div className="flex items-center gap-3 w-full">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    ));
  };
  
  // If no notifications
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Bell className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No notifications</h3>
      <p className="text-muted-foreground mb-6">
        {activeTab === 'all' 
          ? "You don't have any notifications yet" 
          : `You don't have any ${activeTab} notifications`}
      </p>
      <Button 
        variant="outline" 
        onClick={() => setActiveTab('all')}
        className="flex items-center"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        View all notifications
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with course announcements and assignments
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
          >
            {markAllAsReadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </>
            )}
          </Button>
        )}
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <TabsList className="mb-0">
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="course">Course</TabsTrigger>
            <TabsTrigger value="assignment">Assignment</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
        </div>

        <Card>
          <CardHeader className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  {activeTab === 'all' ? 'All notifications' : 
                   activeTab === 'unread' ? 'Unread notifications' :
                   `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} notifications`}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {filteredNotifications.length > 0 && activeTab === 'all' && (
                  <Badge variant="outline">
                    {notifications.length} total
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              renderSkeletons()
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y">
                {filteredNotifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 md:p-6 ${!notification.read ? 'bg-muted/30' : ''}`}
                  >
                    <div className="flex justify-between flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={getNotificationColor(notification.type)}>
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatNotificationDate(notification.created_at)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-base">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markAsReadMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark as read
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteNotification(notification.id)}
                          disabled={deleteNotificationMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              renderEmptyState()
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default Notifications;
