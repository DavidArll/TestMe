// src/auth/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';

const USERS_STORAGE_KEY = '@App:users';
const CURRENT_USER_STORAGE_KEY = '@App:currentUser';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password_not_used_for_mock: string) => Promise<boolean>;
  register: (username: string, password_not_used_for_mock: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      setIsLoading(true); // Set loading true at the start of loading user
      try {
        const storedUser = await AsyncStorage.getItem(CURRENT_USER_STORAGE_KEY);
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
        // Optionally set currentUser to null explicitly if loading fails critically
        // setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserFromStorage();
  }, []);

  const login = async (username: string, password_not_used_for_mock: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];
      const user = users.find(u => u.username === username);

      if (user) { // In a real app, you'd check the hashed password here
        setCurrentUser(user);
        await AsyncStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login failed', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (username: string, password_not_used_for_mock: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      let users: User[] = usersJson ? JSON.parse(usersJson) : [];

      if (users.find(u => u.username === username)) {
        console.log('User already exists');
        setIsLoading(false);
        return false; // User already exists
      }

      const newUser: User = {
        id: Date.now().toString(), // Simple unique ID for mock
        username,
      };
      users.push(newUser);
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      setCurrentUser(newUser);
      await AsyncStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newUser));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration failed', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setCurrentUser(null);
    try {
      await AsyncStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove user from storage', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
