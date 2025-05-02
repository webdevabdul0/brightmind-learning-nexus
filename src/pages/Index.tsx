
import { Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

const Index = () => {
  return (
    <TooltipProvider>
      <Navigate to="/" replace />
    </TooltipProvider>
  );
};

export default Index;
