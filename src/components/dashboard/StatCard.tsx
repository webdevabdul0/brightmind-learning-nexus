
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bgColor?: string;
  textColor?: string;
  className?: string;
}

const StatCard = ({ 
  icon, 
  label, 
  value, 
  bgColor = 'bg-white', 
  textColor = 'text-gray-800',
  className
}: StatCardProps) => {
  return (
    <div className={cn(
      'rounded-lg p-5 shadow flex items-center transform transition-all hover:scale-[1.02] duration-300',
      bgColor,
      textColor,
      className
    )}>
      <div className="mr-4 bg-gray-100/30 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium opacity-80">{label}</p>
        <h3 className="text-2xl font-bold mt-1 animate-fade-in">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;
