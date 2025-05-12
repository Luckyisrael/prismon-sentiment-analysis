import { createContext, useContext, useState } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  userId: string | null;
  login: (userId: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const login = (userId: string) => {
    setIsAuthenticated(true);
    setUserId(userId);
    localStorage.setItem('userId', userId); // Optional: persist across page refreshes
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserId(null);
    localStorage.removeItem('userId'); // Clear persisted userId
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}