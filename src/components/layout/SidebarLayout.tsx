import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Calendar, 
  FileText, 
  Video, 
  BarChart, 
  Bell, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  MessageSquare,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
  collapsed?: boolean;
}

const SidebarItem = ({ icon, label, to, active, collapsed }: SidebarItemProps) => {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link to={to} className={cn(
          'sidebar-item flex items-center gap-3 px-3 py-2 rounded-md text-white hover:bg-white/10 transition-all',
          active && 'bg-white/20',
        )}>
          <div className="w-5 h-5">{icon}</div>
          {!collapsed && <span className="animate-fade-in">{label}</span>}
        </Link>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  );
};

interface Props {
  children: React.ReactNode;
}

const SidebarLayout = ({ children }: Props) => {
  const location = useLocation();
  const { user, profile, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    // Close mobile sidebar when location changes
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const userRole = profile?.role || 'student';

  const items = [
    // Admin only (move to top)
    ...(userRole === 'admin' ? [{ icon: <Home size={20} />, label: 'Admin', to: '/admin', roles: ['admin'] }] : []),
    { icon: <Home size={20} />, label: 'Dashboard', to: '/', roles: ['student', 'teacher'] },
    { icon: <BookOpen size={20} />, label: 'Courses', to: '/courses', roles: ['student', 'teacher'] },
    // Only show Assignments, Live Classes, Performance to students
    ...(userRole === 'student' ? [
      { icon: <FileText size={20} />, label: 'Assignments', to: '/assignments', roles: ['student'] },
      { icon: <Video size={20} />, label: 'Live Classes', to: '/live-classes', roles: ['student'] },
      { icon: <BarChart size={20} />, label: 'Performance', to: '/performance', roles: ['student'] },
    ] : []),
    { icon: <MessageSquare size={20} />, label: 'AI Suggestions', to: '/ai-suggestions', roles: ['student', 'teacher', 'admin'] },
    { icon: <Bell size={20} />, label: 'Notifications', to: '/notifications', roles: ['student', 'teacher', 'admin'] },
    { icon: <User size={20} />, label: 'Profile', to: '/profile', roles: ['student', 'teacher', 'admin'] },
    { icon: <Settings size={20} />, label: 'Settings', to: '/settings', roles: ['student', 'teacher', 'admin'] },
  ];

  const filteredItems = items.filter(item => item.roles.includes(userRole));

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 bg-brightmind-blue h-14 z-50 md:hidden flex items-center justify-between px-4 text-white">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileSidebarOpen(prev => !prev)}
            className="text-white hover:bg-white/10"
          >
            <Menu size={24} />
          </Button>
          <h2 className="text-white font-bold text-xl">Bright Mind</h2>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt={profile?.name || 'User'} />
            <AvatarFallback>{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </div>

        {/* Sidebar - desktop permanent, mobile as drawer */}
        <div className={cn(
          "bg-brightmind-blue transition-all duration-300 flex flex-col justify-between z-40",
          collapsed ? "w-16" : "w-64",
          "fixed md:sticky top-0 h-screen",
          isMobile ? (mobileSidebarOpen ? "left-0" : "-left-full") : "left-0"
        )}>
          {/* Sidebar Header */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <h2 className="text-white font-bold text-xl animate-fade-in">Bright Mind</h2>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCollapsed(!collapsed)}
                className="text-white hover:bg-white/10 hidden md:flex"
              >
                {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </Button>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 py-8 flex flex-col gap-2 px-2 mt-10 md:mt-0">
            {filteredItems.map((item, index) => (
              <SidebarItem
                key={index}
                icon={item.icon}
                label={item.label}
                to={item.to}
                active={location.pathname === item.to}
                collapsed={collapsed}
              />
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder.svg" alt={profile?.name || 'User'} />
                <AvatarFallback>{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 animate-fade-in">
                  <p className="text-sm font-medium text-white">{profile?.name || 'User'}</p>
                  <p className="text-xs text-white/70 capitalize">{userRole}</p>
                </div>
              )}
              {!collapsed && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={logout}
                  className="text-white hover:bg-white/10"
                >
                  <LogOut size={18} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content with mobile top padding */}
        <div className="flex-1 overflow-auto pt-14 md:pt-0">
          <div className="min-h-full p-4 md:p-6">
            {children}
          </div>
        </div>
        
        {/* Mobile sidebar backdrop */}
        {mobileSidebarOpen && isMobile && (
          <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default SidebarLayout;
