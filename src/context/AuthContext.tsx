
import React, { createContext, useState, useEffect, ReactNode } from 'react';

// Define User interface
export interface User {
  id: string;
  name: string;
  email: string;
}

// Define AuthContext interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

// Create the AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('songscribe_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Mock login function - in a real app, this would make an API request
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, create a mock user
    const mockUser = {
      id: '1',
      name: email.split('@')[0], // Extract name from email
      email,
    };
    
    localStorage.setItem('songscribe_user', JSON.stringify(mockUser));
    setUser(mockUser);
    setIsLoading(false);
  };

  // Mock register function
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, create a new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
    };
    
    localStorage.setItem('songscribe_user', JSON.stringify(newUser));
    setUser(newUser);
    setIsLoading(false);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('songscribe_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
