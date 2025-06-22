import { useAuth } from "@/providers/AuthProvider";
import { Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";

const RootRedirect = () => {
  const { profile } = useAuth();

  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Dashboard />;
};

export default RootRedirect; 