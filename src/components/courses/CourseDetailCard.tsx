
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRoleCheck } from '@/hooks/use-role-check';
import EnrollmentButton from './EnrollmentButton';

interface CourseDetailCardProps {
  course: any;
  isEnrolled: boolean;
  onEnrollmentChange?: () => void;
}

const CourseDetailCard = ({ course, isEnrolled, onEnrollmentChange }: CourseDetailCardProps) => {
  const navigate = useNavigate();
  const { isTeacher, isAdmin } = useRoleCheck();
  const isInstructor = course.instructor_id === course.id;
  const canEdit = isAdmin || (isTeacher && isInstructor);
  
  return (
    <Card className="overflow-hidden">
      {course.image_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={course.image_url} 
            alt={course.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {course.category}
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                {course.level}
              </span>
              {course.duration && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                  {course.duration}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => navigate(`/courses/${course.id}/edit`)}
              >
                Edit Course
              </Button>
            )}
            <EnrollmentButton 
              courseId={course.id} 
              isEnrolled={isEnrolled}
              onEnrollmentChange={onEnrollmentChange}
            />
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-1">Description</h3>
            <p className="text-gray-600 dark:text-gray-300">{course.description}</p>
          </div>
          
          {course.price !== null && (
            <div>
              <h3 className="text-lg font-medium mb-1">Price</h3>
              <p className="text-xl font-bold">
                {course.price > 0 ? `$${course.price.toFixed(2)}` : 'Free'}
              </p>
            </div>
          )}
          
          {course.instructor && (
            <div>
              <h3 className="text-lg font-medium mb-1">Instructor</h3>
              <div className="flex items-center gap-2">
                {course.instructor.avatar_url ? (
                  <img 
                    src={course.instructor.avatar_url} 
                    alt={course.instructor.name || 'Instructor'} 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-500">
                      {(course.instructor.name || 'I').charAt(0)}
                    </span>
                  </div>
                )}
                <span>{course.instructor.name || 'Instructor'}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-800 p-6">
        {isEnrolled ? (
          <Button className="w-full" onClick={() => navigate(`/courses/${course.id}/lessons`)}>
            Continue Learning
          </Button>
        ) : !isTeacher && !isAdmin ? (
          <EnrollmentButton 
            courseId={course.id} 
            isEnrolled={isEnrolled}
            onEnrollmentChange={onEnrollmentChange}
          />
        ) : null}
      </CardFooter>
    </Card>
  );
};

export default CourseDetailCard;
