import { MoreVertical, BookOpen, User2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CourseProgress {
  completed: number;
  total: number;
}

interface CourseCardProps {
  id: string;
  title: string;
  instructor: string;
  color: string;
  progress: CourseProgress;
  onClick?: () => void;
  isEnrolled?: boolean;
  isLoadingEnrollments?: boolean;
  userRole?: string;
  onEnroll?: (courseId: string, e: React.MouseEvent) => void;
  price?: number | null;
  className?: string;
}

const CourseCard = ({ 
  id, 
  title, 
  instructor, 
  color, 
  progress,
  onClick,
  isEnrolled = false,
  isLoadingEnrollments = false,
  userRole = '',
  onEnroll,
  price = null,
  className
}: CourseCardProps) => {
  const progressPercent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const isPremium = price && price > 0;
  
  return (
    <div 
      className={cn(`rounded-xl p-4 sm:p-6 relative overflow-hidden cursor-pointer transform transition-all hover:translate-y-[-5px] duration-300 ${color} border border-border`, className)}
      onClick={onClick}
    >
      {/* Premium badge */}
      {isPremium && (
        <Badge className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 font-bold shadow px-3 py-1 z-10" style={{fontSize: '0.85rem'}}>
          Premium
        </Badge>
      )}
      <div className="flex justify-between items-start mb-4">
        <div className="pr-8">
          <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-2 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-white drop-shadow" />
            {title}
          </h3>
          <p className="text-sm opacity-90 line-clamp-1 flex items-center gap-1">
            <User2 className="h-4 w-4 text-white/80 mr-1" />
            <span className="font-medium text-white/90">Teacher: {instructor}</span>
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 absolute top-4 right-4">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Enroll button for students only, not enrolled, not loading */}
      {!isLoadingEnrollments && !isEnrolled && userRole === 'student' && onEnroll && (
        <div className="absolute bottom-4 right-4">
          <Button 
            size="sm" 
            onClick={e => {
              e.stopPropagation();
              onEnroll(id, e);
            }}
          >
            Enroll
          </Button>
        </div>
      )}
      
      {/* Only show progress for students who are enrolled */}
      {userRole === 'student' && isEnrolled && (
        <div className="mt-8 sm:mt-12">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-1">
            <div 
              className="h-full bg-primary transition-all duration-700 ease-out" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-xs text-right text-white">{progress.completed} of {progress.total} completed</div>
        </div>
      )}
    </div>
  );
};

export default CourseCard;
