import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const Settings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  type UserSettings = {
    theme: string;
    email_notifications: boolean;
    browser_notifications: boolean;
    language: string;
    assignment_reminders?: boolean;
    class_reminders?: boolean;
  };
  
  // Only allow the user to view/edit their settings
  if (!user || user.id !== profile?.id) {
    return <div className="p-8 text-center text-red-600 font-bold">Unauthorized</div>;
  }
  
  // Fetch user settings
  const { data: userSettings, isLoading: isLoadingSettings } = useQuery<UserSettings | null>({
    queryKey: ['userSettings', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        toast({
          title: "Error fetching settings",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      return (data as UserSettings) || {
        theme: 'light',
        email_notifications: true,
        browser_notifications: true,
        language: 'english',
        assignment_reminders: true,
        class_reminders: true
      };
    },
    enabled: !!user
  });
  
  // Profile settings
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);
  const [classReminders, setClassReminders] = useState(true);
  
  // Appearance settings
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('english');
  
  // Account settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Update state with fetched settings
  useEffect(() => {
    if (userSettings) {
      setTheme(userSettings.theme || 'light');
      setEmailNotifications(userSettings.email_notifications || true);
      setBrowserNotifications(userSettings.browser_notifications || true);
      setLanguage(userSettings.language || 'english');
      setAssignmentReminders(userSettings.assignment_reminders ?? true);
      setClassReminders(userSettings.class_reminders ?? true);
    }
  }, [userSettings]);

  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not logged in');

      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          email,
          phone,
          bio
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated.",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  // Update notification settings mutation
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not logged in');

      const { error } = await supabase
        .from('user_settings')
        .update({
          email_notifications: emailNotifications,
          browser_notifications: browserNotifications,
          assignment_reminders: assignmentReminders,
          class_reminders: classReminders
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings', user?.id] });
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved.",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  // Update appearance settings mutation
  const updateAppearanceSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not logged in');

      const { error } = await supabase
        .from('user_settings')
        .update({
          theme,
          language
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings', user?.id] });
      toast({
        title: "Appearance settings updated",
        description: "Your display preferences have been saved.",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
        duration: 3000,
      });
      
      // Reset the form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const handleProfileUpdate = () => {
    updateProfileMutation.mutate();
  };

  const handleNotificationSettingsUpdate = () => {
    updateNotificationSettingsMutation.mutate();
  };

  const handleAppearanceSettingsUpdate = () => {
    updateAppearanceSettingsMutation.mutate();
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    changePasswordMutation.mutate();
  };

  // Render skeletons while loading
  if (isLoadingSettings) {
    return (
      <div className="container mx-auto animate-fade-in">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto animate-fade-in">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">Settings</h1>

      <Tabs defaultValue="profile" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and how others see you on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profile?.role || ''}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                />
              </div>
              
              <Button 
                onClick={handleProfileUpdate} 
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Browser Notifications</h4>
                    <p className="text-sm text-gray-500">Show notifications in your browser</p>
                  </div>
                  <Switch
                    checked={browserNotifications}
                    onCheckedChange={setBrowserNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Assignment Reminders</h4>
                    <p className="text-sm text-gray-500">Receive reminders about upcoming assignments</p>
                  </div>
                  <Switch
                    checked={assignmentReminders}
                    onCheckedChange={setAssignmentReminders}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Live Class Reminders</h4>
                    <p className="text-sm text-gray-500">Receive reminders before scheduled classes</p>
                  </div>
                  <Switch
                    checked={classReminders}
                    onCheckedChange={setClassReminders}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleNotificationSettingsUpdate}
                disabled={updateNotificationSettingsMutation.isPending}
              >
                {updateNotificationSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Customize how the application looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <RadioGroup value={theme} onValueChange={setTheme} className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light">Light</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark">Dark</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system">System</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleAppearanceSettingsUpdate}
                disabled={updateAppearanceSettingsMutation.isPending}
              >
                {updateAppearanceSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Manage your password and account security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Change Password</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handlePasswordChange}
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
