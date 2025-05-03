
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

const CourseCard = ({ 
  id, 
  title, 
  instructor, 
  color, 
  progress,
  onClick 
}: CourseCardProps) => {
  const progressPercent = Math.round((progress.completed / progress.total) * 100);
  
  return (
    <div 
      className={`rounded-xl p-4 sm:p-6 relative overflow-hidden cursor-pointer transform transition-all hover:translate-y-[-5px] duration-300 ${color}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="pr-8">
          <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-2">{title}</h3>
          <p className="text-sm opacity-80 line-clamp-1">{instructor}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 absolute top-4 right-4">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="mt-8 sm:mt-12">
        <div className="flex justify-between text-sm mb-2">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-700 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
