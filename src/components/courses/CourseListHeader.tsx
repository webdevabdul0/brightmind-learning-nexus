
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useRoleCheck } from '@/hooks/use-role-check';
import { Plus } from 'lucide-react';

interface CourseListHeaderProps {
  title: string;
}

const CourseListHeader = ({ title }: CourseListHeaderProps) => {
  const navigate = useNavigate();
  const { isTeacher, isAdmin } = useRoleCheck();
  
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {(isTeacher || isAdmin) && (
        <Button onClick={() => navigate('/courses/create')} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Create Course
        </Button>
      )}
    </div>
  );
};

export default CourseListHeader;
