
import React, { createContext, useState, useContext, useEffect } from 'react';

type UserRole = 'student' | 'teacher' | 'admin';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  rollNumber?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rollNumber?: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole, rollNumber?: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const mockUsers: User[] = [
  {
    id: '1',
    email: 'student@example.com',
    name: 'John Student',
    role: 'student',
    rollNumber: 'S12345',
  },
  {
    id: '2',
    email: 'teacher@example.com',
    name: 'Mary Teacher',
    role: 'teacher',
  },
  {
    id: '3',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check for saved user on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('brightmind_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, rollNumber?: string) => {
    setLoading(true);
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication logic
      const foundUser = mockUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        (!rollNumber || u.rollNumber === rollNumber)
      );
      
      if (!foundUser) {
        throw new Error('Invalid credentials');
      }
      
      // Save user to state and localStorage
      setUser(foundUser);
      localStorage.setItem('brightmind_user', JSON.stringify(foundUser));
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole, rollNumber?: string) => {
    setLoading(true);
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new user (in a real app, this would call a backend API)
      const newUser: User = {
        id: `${Date.now()}`,
        email,
        name,
        role,
        rollNumber,
      };
      
      // Save user to state and localStorage
      setUser(newUser);
      localStorage.setItem('brightmind_user', JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('brightmind_user');
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would trigger a password reset email
      console.log(`Password reset email sent to ${email}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('brightmind_user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
