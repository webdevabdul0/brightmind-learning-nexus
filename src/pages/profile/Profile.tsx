
import { useState } from 'react';
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
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { Progress } from '@/components/ui/progress';

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock profile data
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Student Name',
    email: user?.email || 'student@example.com',
    phone: '+1 (555) 123-4567',
    school: 'Cambridge International School',
    address: 'London, United Kingdom',
    grade: '11th Grade',
    bio: 'Passionate science student focusing on physics and mathematics. Looking forward to pursuing engineering in university.'
  });

  const handleSaveProfile = () => {
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been saved successfully.",
    });
  };

  const handleUploadPhoto = () => {
    toast({
      title: "Photo upload",
      description: "Profile photo upload functionality will be implemented soon.",
    });
  };

  // Mock courses data
  const enrolledCourses = [
    { id: '1', title: 'Introduction to Physics', progress: 58 },
    { id: '2', title: 'Advanced Mathematics for O Levels', progress: 75 },
    { id: '3', title: 'English Literature Essentials', progress: 32 }
  ];

  // Mock achievements data
  const achievements = [
    { id: '1', title: 'Physics Quiz Champion', date: 'May 15, 2023', badge: '🏆' },
    { id: '2', title: 'Perfect Attendance', date: 'April 2023', badge: '🌟' },
    { id: '3', title: 'Math Problem Solver', date: 'March 20, 2023', badge: '🧩' },
    { id: '4', title: 'Essay Competition Finalist', date: 'February 10, 2023', badge: '📝' }
  ];

  return (
    <div className="container mx-auto animate-fade-in pb-10">
      <h1 className="text-4xl font-bold mb-8">My Profile</h1>
      
      <Tabs defaultValue="personal" className="mb-8">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Summary */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2 flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src="/placeholder.svg" alt={profileData.name} />
                    <AvatarFallback className="text-4xl">{profileData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute bottom-0 right-0 rounded-full bg-white"
                    onClick={handleUploadPhoto}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-center text-2xl">{profileData.name}</CardTitle>
                <div className="flex items-center text-muted-foreground gap-1 mt-1">
                  <School className="h-4 w-4" />
                  <span className="text-sm">{profileData.grade}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-sm">Email</p>
                      <p>{profileData.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-sm">Phone</p>
                      <p>{profileData.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <School className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-sm">School</p>
                      <p>{profileData.school}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-sm">Location</p>
                      <p>{profileData.address}</p>
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
                >
                  {isEditing ? (
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
                        value={profileData.name} 
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      />
                    ) : (
                      <p>{profileData.name}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      {isEditing ? (
                        <Input 
                          value={profileData.email} 
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        />
                      ) : (
                        <p>{profileData.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      {isEditing ? (
                        <Input 
                          value={profileData.phone} 
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        />
                      ) : (
                        <p>{profileData.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">School</label>
                      {isEditing ? (
                        <Input 
                          value={profileData.school} 
                          onChange={(e) => setProfileData({...profileData, school: e.target.value})}
                        />
                      ) : (
                        <p>{profileData.school}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Grade</label>
                      {isEditing ? (
                        <Input 
                          value={profileData.grade} 
                          onChange={(e) => setProfileData({...profileData, grade: e.target.value})}
                        />
                      ) : (
                        <p>{profileData.grade}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address</label>
                    {isEditing ? (
                      <Input 
                        value={profileData.address} 
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      />
                    ) : (
                      <p>{profileData.address}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    {isEditing ? (
                      <textarea 
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={profileData.bio} 
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      />
                    ) : (
                      <p>{profileData.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="courses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Enrolled Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {enrolledCourses.map(course => (
                  <div key={course.id} className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold flex items-center">
                        <BookOpen className="h-5 w-5 mr-2 text-brightmind-blue" />
                        {course.title}
                      </h3>
                      <Button variant="ghost" size="sm" className="text-brightmind-blue">View Course</Button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map(achievement => (
                  <div key={achievement.id} className="bg-slate-50 p-4 rounded-lg flex items-center">
                    <div className="h-12 w-12 rounded-full bg-brightmind-lightpurple text-2xl flex items-center justify-center mr-4">
                      {achievement.badge}
                    </div>
                    <div>
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {achievement.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
