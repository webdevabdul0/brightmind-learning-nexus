
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";

// Layout
import SidebarLayout from "@/components/layout/SidebarLayout";

// Auth pages
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ResetPassword from "@/pages/auth/ResetPassword";
import ResetPasswordUpdate from "@/pages/auth/ResetPasswordUpdate";

// Protected pages
import Dashboard from "@/pages/Dashboard";
import CourseList from "@/pages/courses/CourseList";
import CourseDetail from "@/pages/courses/CourseDetail";
import LiveClasses from "@/pages/live/LiveClasses";
import LiveSession from "@/pages/live/LiveSession";
import AISuggestions from "@/pages/ai/AISuggestions";
import AssignmentList from "@/pages/assignments/AssignmentList";
import Profile from "@/pages/profile/Profile";
import Notifications from "@/pages/notifications/Notifications";
import Performance from "@/pages/performance/Performance";
import Settings from "@/pages/settings/Settings";

// Other pages
import NotFound from "@/pages/NotFound";
import RequireAuth from "@/components/auth/RequireAuth";
import Unauthorized from "@/pages/Unauthorized";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password-update" element={<ResetPasswordUpdate />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <RequireAuth>
              <SidebarLayout>
                <Dashboard />
              </SidebarLayout>
            </RequireAuth>
          } />
          
          <Route path="/courses" element={
            <RequireAuth>
              <SidebarLayout>
                <CourseList />
              </SidebarLayout>
            </RequireAuth>
          } />
          
          <Route path="/courses/:courseId" element={
            <RequireAuth>
              <SidebarLayout>
                <CourseDetail />
              </SidebarLayout>
            </RequireAuth>
          } />
          
          <Route path="/assignments" element={
            <RequireAuth>
              <SidebarLayout>
                <AssignmentList />
              </SidebarLayout>
            </RequireAuth>
          } />
          
          <Route path="/live-classes" element={
            <RequireAuth>
              <SidebarLayout>
                <LiveClasses />
              </SidebarLayout>
            </RequireAuth>
          } />
          
          <Route path="/live-classes/:sessionId" element={
            <RequireAuth>
              <SidebarLayout>
                <LiveSession />
              </SidebarLayout>
            </RequireAuth>
          } />
          
          <Route path="/profile" element={
            <RequireAuth>
              <SidebarLayout>
                <Profile />
              </SidebarLayout>
            </RequireAuth>
          } />
          
          <Route path="/notifications" element={
            <RequireAuth>
              <SidebarLayout>
                <Notifications />
              </SidebarLayout>
            </RequireAuth>
          } />
          
          <Route path="/performance" element={
            <RequireAuth>
              <SidebarLayout>
                <Performance />
              </SidebarLayout>
            </RequireAuth>
          } />
          
          <Route path="/settings" element={
            <RequireAuth>
              <SidebarLayout>
                <Settings />
              </SidebarLayout>
            </RequireAuth>
          } />
          
          <Route path="/ai-suggestions" element={
            <RequireAuth>
              <SidebarLayout>
                <AISuggestions />
              </SidebarLayout>
            </RequireAuth>
          } />
          
          {/* Additional routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
