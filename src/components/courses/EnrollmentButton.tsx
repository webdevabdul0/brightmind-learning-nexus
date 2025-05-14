
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRoleCheck } from '@/hooks/use-role-check';

interface EnrollmentButtonProps {
  courseId: string;
  isEnrolled: boolean;
  onEnrollmentChange?: () => void;
}

const EnrollmentButton = ({ 
  courseId, 
  isEnrolled, 
  onEnrollmentChange 
}: EnrollmentButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { isStudent } = useRoleCheck();
  
  const handleEnrollment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to enroll in this course.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      if (isEnrolled) {
        // Unenroll from course
        const { error } = await supabase
          .from('enrollments')
          .delete()
          .eq('course_id', courseId)
          .eq('student_id', user.id);
          
        if (error) throw error;
        
        toast({
          title: "Unenrolled",
          description: "You have been unenrolled from this course.",
        });
      } else {
        // Enroll in course
        const { error } = await supabase
          .from('enrollments')
          .insert({
            course_id: courseId,
            student_id: user.id,
            progress: 0,
          });
          
        if (error) throw error;
        
        toast({
          title: "Enrolled",
          description: "You have successfully enrolled in this course.",
        });
      }
      
      if (onEnrollmentChange) {
        onEnrollmentChange();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Only show button to students
  if (!isStudent) return null;
  
  return (
    <Button
      onClick={handleEnrollment}
      disabled={isLoading}
      variant={isEnrolled ? "outline" : "default"}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEnrolled ? "Unenrolling..." : "Enrolling..."}
        </>
      ) : (
        isEnrolled ? "Unenroll" : "Enroll Now"
      )}
    </Button>
  );
};

export default EnrollmentButton;
