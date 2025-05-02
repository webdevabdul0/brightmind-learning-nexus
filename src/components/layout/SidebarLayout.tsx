
import React, { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { TooltipProvider } from '@/components/ui/tooltip';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
  collapsed?: boolean;
}

const SidebarItem = ({ icon, label, to, active, collapsed }: SidebarItemProps) => {
  return (
    <Link to={to} className={cn(
      'sidebar-item flex items-center gap-3 px-3 py-2 rounded-md text-white hover:bg-white/10 transition-all',
      active && 'bg-white/20',
    )}>
      <div className="w-5 h-5">{icon}</div>
      {!collapsed && <span className="animate-fade-in">{label}</span>}
    </Link>
  );
};

interface Props {
  children: React.ReactNode;
}

const SidebarLayout = ({ children }: Props) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const userRole = user?.role || 'student';

  const items = [
    { icon: <Home size={20} />, label: 'Dashboard', to: '/', roles: ['student', 'teacher', 'admin'] },
    { icon: <BookOpen size={20} />, label: 'Courses', to: '/courses', roles: ['student', 'teacher', 'admin'] },
    { icon: <FileText size={20} />, label: 'Assignments', to: '/assignments', roles: ['student', 'teacher', 'admin'] },
    { icon: <Video size={20} />, label: 'Live Classes', to: '/live-classes', roles: ['student', 'teacher', 'admin'] },
    { icon: <BarChart size={20} />, label: 'Performance', to: '/performance', roles: ['student', 'teacher', 'admin'] },
    { icon: <MessageSquare size={20} />, label: 'AI Suggestions', to: '/ai-suggestions', roles: ['student', 'teacher', 'admin'] },
    { icon: <Bell size={20} />, label: 'Notifications', to: '/notifications', roles: ['student', 'teacher', 'admin'] },
    { icon: <User size={20} />, label: 'Profile', to: '/profile', roles: ['student', 'teacher', 'admin'] },
    { icon: <Settings size={20} />, label: 'Settings', to: '/settings', roles: ['student', 'teacher', 'admin'] },
  ];

  const filteredItems = items.filter(item => item.roles.includes(userRole));

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className={cn(
          "bg-brightmind-blue transition-all duration-300 flex flex-col justify-between",
          collapsed ? "w-16" : "w-64"
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
                className="text-white hover:bg-white/10"
              >
                {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </Button>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 py-8 flex flex-col gap-2 px-2">
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
                <AvatarImage src="/placeholder.svg" alt={user?.name || 'User'} />
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 animate-fade-in">
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
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

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="min-h-full p-6">
            {children}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SidebarLayout;
