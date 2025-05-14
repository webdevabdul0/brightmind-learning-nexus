
import { useAuth } from '@/providers/AuthProvider';

export function useRoleCheck() {
  const { profile } = useAuth();
  
  return {
    isStudent: profile?.role === 'student',
    isTeacher: profile?.role === 'teacher',
    isAdmin: profile?.role === 'admin',
    currentRole: profile?.role
  };
}
