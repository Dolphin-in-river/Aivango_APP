import { createContext, useContext, useEffect, useState } from 'react';

/* ---------- Types ---------- */
export interface User {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isOrganizer?: boolean;
  token?: string;
}
interface AuthContextValue {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

/* ---------- Helpers ---------- */
const STORAGE_KEY = 'aivango-auth';

/* ---------- Context ---------- */
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);

  /* 1️⃣  Re-hydrate on first render */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: User = JSON.parse(stored);

        // Совместимость: в новых версиях бэкенд возвращает isOrganizer.
        if (typeof parsed.isOrganizer === 'boolean') {
          if (!parsed.role) parsed.role = parsed.isOrganizer ? 'organizer' : 'user';
        } else if (parsed.role) {
          const r = String(parsed.role).trim().toLowerCase();
          parsed.isOrganizer = r === 'organizer' || r === 'organiser' || r === 'организатор' || r === 'orgranizer';
        }

        setUser(parsed);
      } catch {
        /* corrupted data – clear it */
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  /* 2️⃣  Helpers */
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  /* 3️⃣  Provide value */
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/* ---------- Hook ---------- */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
