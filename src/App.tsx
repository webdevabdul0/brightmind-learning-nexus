import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";

// Layout
import SidebarLayout from "@/components/layout/SidebarLayout";

// Auth pages
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ResetPassword from "@/pages/auth/ResetPassword";

// Protected pages
import Dashboard from "@/pages/Dashboard";
import CourseList from "@/pages/courses/CourseList";
import CourseDetail from "@/pages/courses/CourseDetail";
import LiveClasses from "@/pages/live/LiveClasses";
import LiveSession from "@/pages/live/LiveSession";
import AISuggestions from "@/pages/ai/AISuggestions";

// Other pages
import NotFound from "@/pages/NotFound";
import RequireAuth from "@/components/auth/RequireAuth";
import Unauthorized from "@/pages/Unauthorized";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
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
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
