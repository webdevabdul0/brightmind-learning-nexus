import { useState, ChangeEvent, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Mail, 
  BookOpen, 
  Star, 
  Calendar, 
  Edit,
  Save,
  Upload,
  School,
  MapPin,
  Phone,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

const COURSE_COLORS = [
  'bg-brightmind-purple text-white',
  'bg-brightmind-blue text-white',
  'bg-blue-500 text-white',
  'bg-green-500 text-white',
  'bg-indigo-500 text-white',
  'bg-fuchsia-500 text-white',
  'bg-rose-500 text-white',
  'bg-orange-500 text-white',
  'bg-amber-500 text-white',
  'bg-emerald-500 text-white',
  'bg-cyan-500 text-white',
  'bg-violet-500 text-white',
  'bg-pink-500 text-white',
  'bg-red-500 text-white',
  'bg-blue-500 text-white',
  'bg-green-500 text-white',
  'bg-indigo-500 text-white',
];

function getRandomColor(idx: number) {
  return COURSE_COLORS[idx % COURSE_COLORS.length];
}

const Profile = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();

  // Only allow the user, teachers, or admins to view/edit
  if (!user || (!['teacher', 'admin'].includes(profile?.role) && user.id !== profile?.id)) {
    return <div className="p-8 text-center text-red-600 font-bold">Unauthorized</div>;
  }

  // All hooks must be after the authorization check
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  
  // Form state
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    school: profile?.school || '',
    address: profile?.address || '',
    grade: profile?.grade || '',
    bio: profile?.bio || ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Fetch enrolled courses
  const { data: enrolledCourses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['userEnrolledCourses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('student_id', user.id);
        
      if (error) {
        toast({
          title: "Error fetching courses",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user
  });

  // Mock achievements data (to be implemented with real data)
  const achievements = [
    { id: '1', title: 'Physics Quiz Champion', date: 'May 15, 2023', badge: '🏆' },
    { id: '2', title: 'Perfect Attendance', date: 'April 2023', badge: '🌟' },
    { id: '3', title: 'Math Problem Solver', date: 'March 20, 2023', badge: '🧩' },
    { id: '4', title: 'Essay Competition Finalist', date: 'February 10, 2023', badge: '📝' }
  ];

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: any) => {
      await updateProfile(updatedProfile);
    },
    onSuccess: () => {
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSaveProfile = () => {
    // Phone validation: only digits, optional +, 10-15 digits
    const phoneRegex = /^\+?\d{10,15}$/;
    if (!phoneRegex.test(profileForm.phone)) {
      setPhoneError('Please enter a valid phone number (10-15 digits, numbers only).');
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid phone number (10-15 digits, numbers only).',
        variant: 'destructive',
      });
      return;
    }
    setPhoneError(null);
    updateProfileMutation.mutate(profileForm);
  };

  const handleUploadPhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) return;
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}.${fileExt}`;
      const { data, error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (error) throw error;
      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatar_url = publicUrlData.publicUrl;
      // Update profile
      await updateProfile({ ...profile, avatar_url });
      toast({
        title: 'Profile photo updated',
        description: 'Your profile photo has been updated successfully.'
      });
      queryClient.invalidateQueries();
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Update form state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    if (name === 'phone') {
      const phoneRegex = /^\+?\d{10,15}$/;
      if (!phoneRegex.test(value)) {
        setPhoneError('Please enter a valid phone number (10-15 digits, numbers only).');
      } else {
        setPhoneError(null);
      }
    }
  };

  // Render course skeletons
  const renderCourseSkeletons = () => {
    return Array(3).fill(0).map((_, i) => (
      <div key={i} className="bg-slate-50 p-4 rounded-lg">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <div className="space-y-1 mt-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/6" />
          </div>
          <Skeleton className="h-2 w-full mt-1" />
        </div>
      </div>
    ));
  };

  return (
    <div className="container mx-auto animate-fade-in pb-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">My Profile</h1>
      
      <Tabs defaultValue="personal" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          {profile?.role === 'student' && <TabsTrigger value="courses">My Courses</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="personal" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Summary */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2 flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.name || 'User'} />
                    <AvatarFallback className="text-4xl">{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute bottom-0 right-0 rounded-full bg-white"
                    onClick={handleUploadPhoto}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
                <CardTitle className="text-center text-2xl">{profile?.name || 'User'}</CardTitle>
                <div className="flex items-center text-muted-foreground gap-1 mt-1">
                  <School className="h-4 w-4" />
                  <span className="text-sm">{profile?.grade || 'Student'}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-sm">Email</p>
                      <p>{profile?.email || user?.email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-sm">Phone</p>
                      <p>{profile?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <School className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-sm">School</p>
                      <p>{profile?.school || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-sm">Location</p>
                      <p>{profile?.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Profile Details */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Profile Details</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    {isEditing ? (
                      <Input 
                        name="name"
                        value={profileForm.name} 
                        onChange={handleInputChange}
                        placeholder="Your full name"
                      />
                    ) : (
                      <p>{profile?.name || 'Not provided'}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      {isEditing ? (
                        <Input 
                          name="email"
                          value={profileForm.email} 
                          readOnly
                          className="bg-gray-100 cursor-not-allowed"
                          placeholder="Your email address"
                        />
                      ) : (
                        <p>{profile?.email || user?.email || 'Not provided'}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      {isEditing ? (
                        <Input 
                          name="phone"
                          value={profileForm.phone} 
                          onChange={handleInputChange}
                          placeholder="Your phone number"
                        />
                      ) : (
                        <p>{profile?.phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">School</label>
                      {isEditing ? (
                        <Input 
                          name="school"
                          value={profileForm.school} 
                          onChange={handleInputChange}
                          placeholder="Your school name"
                        />
                      ) : (
                        <p>{profile?.school || 'Not provided'}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Grade</label>
                      {isEditing ? (
                        <Input 
                          name="grade"
                          value={profileForm.grade} 
                          onChange={handleInputChange}
                          placeholder="Your current grade"
                        />
                      ) : (
                        <p>{profile?.grade || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address</label>
                    {isEditing ? (
                      <Input 
                        name="address"
                        value={profileForm.address} 
                        onChange={handleInputChange}
                        placeholder="Your address"
                      />
                    ) : (
                      <p>{profile?.address || 'Not provided'}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    {isEditing ? (
                      <textarea 
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        name="bio"
                        value={profileForm.bio} 
                        onChange={handleInputChange}
                        placeholder="Write something about yourself"
                      />
                    ) : (
                      <p>{profile?.bio || 'No bio provided'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {profile?.role === 'student' && (
          <TabsContent value="courses" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Enrolled Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {isLoadingCourses ? (
                    renderCourseSkeletons()
                  ) : enrolledCourses && enrolledCourses.length > 0 ? (
                    enrolledCourses.map((enrollment: any) => {
                      const course = enrollment.course;
                      const hash = Math.abs(
                        [...course.id + course.title].reduce((acc, c) => acc + c.charCodeAt(0), 0)
                      );
                      const color = getRandomColor(hash);
                      return (
                        <div key={enrollment.id} className="rounded-xl p-4 bg-card text-card-foreground border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold flex items-center">
                              <BookOpen className="h-5 w-5 mr-2 text-primary drop-shadow" />
                              {course.title}
                            </h3>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary"
                              onClick={() => window.location.href = `/courses/${course.id}`}
                            >
                              View Course
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center p-6 bg-muted/40 rounded-lg">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't enrolled in any courses yet.
                      </p>
                      <Button onClick={() => window.location.href = '/courses'}>Browse Courses</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Profile;
