
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";

// Layout
import SidebarLayout from "@/components/layout/SidebarLayout";

// Pages
import Dashboard from "@/pages/Dashboard";
import CourseList from "@/pages/courses/CourseList";
import CreateCourse from "@/pages/courses/CreateCourse";
import CourseDetail from "@/pages/courses/CourseDetail";
import LiveClasses from "@/pages/live/LiveClasses";
import LiveSession from "@/pages/live/LiveSession";
import AssignmentList from "@/pages/assignments/AssignmentList";
import AISuggestions from "@/pages/ai/AISuggestions";
import Profile from "@/pages/profile/Profile";
import Performance from "@/pages/performance/Performance";
import Settings from "@/pages/settings/Settings";
import Notifications from "@/pages/notifications/Notifications";
import NotFound from "@/pages/NotFound";
import Unauthorized from "@/pages/Unauthorized";

// Auth pages
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ResetPassword from "@/pages/auth/ResetPassword";
import ResetPasswordUpdate from "@/pages/auth/ResetPasswordUpdate";

// Components
import RequireAuth from "@/components/auth/RequireAuth";

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth routes - not protected */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password-update" element={<ResetPasswordUpdate />} />
            
            {/* Redirect from index page to root */}
            <Route path="/index" element={<Navigate to="/" replace />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            } />

            {/* Course routes */}
            <Route path="/courses" element={
              <RequireAuth>
                <CourseList />
              </RequireAuth>
            } />
            <Route path="/courses/create" element={
              <RequireAuth allowedRoles={['teacher', 'admin']}>
                <CreateCourse />
              </RequireAuth>
            } />
            <Route path="/courses/:id" element={
              <RequireAuth>
                <CourseDetail />
              </RequireAuth>
            } />
            <Route path="/courses/:id/edit" element={
              <RequireAuth allowedRoles={['teacher', 'admin']}>
                <CreateCourse />
              </RequireAuth>
            } />

            {/* Live classes */}
            <Route path="/live-classes" element={
              <RequireAuth>
                <LiveClasses />
              </RequireAuth>
            } />
            <Route path="/live-classes/:id" element={
              <RequireAuth>
                <LiveSession />
              </RequireAuth>
            } />

            {/* Assignments */}
            <Route path="/assignments" element={
              <RequireAuth>
                <AssignmentList />
              </RequireAuth>
            } />

            {/* AI Suggestions */}
            <Route path="/ai-suggestions" element={
              <RequireAuth>
                <AISuggestions />
              </RequireAuth>
            } />

            {/* Profile */}
            <Route path="/profile" element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            } />

            {/* Performance */}
            <Route path="/performance" element={
              <RequireAuth>
                <Performance />
              </RequireAuth>
            } />

            {/* Settings */}
            <Route path="/settings" element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            } />

            {/* Notifications */}
            <Route path="/notifications" element={
              <RequireAuth>
                <Notifications />
              </RequireAuth>
            } />

            {/* Error pages */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <Toaster />
          <Sonner />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
