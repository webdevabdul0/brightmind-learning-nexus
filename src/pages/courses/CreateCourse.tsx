
import React from 'react';
import { Navigate } from 'react-router-dom';
import SidebarLayout from '@/components/layout/SidebarLayout';
import CourseForm from '@/components/courses/CourseForm';
import { useRoleCheck } from '@/hooks/use-role-check';

const CreateCourse = () => {
  const { isTeacher, isAdmin } = useRoleCheck();
  
  // Only teachers and admins can create courses
  if (!isTeacher && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <SidebarLayout>
      <div className="container max-w-4xl py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Course</h1>
        <CourseForm />
      </div>
    </SidebarLayout>
  );
};

export default CreateCourse;
