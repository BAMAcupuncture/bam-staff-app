// src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, firestore } from '../config/firebase';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Define the shape of your user profile data
interface UserProfile {
  name: string;
  role: 'Admin' | 'Staff';
  // Add other profile fields as needed
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
s  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
  // You can add signup here if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener is the core of Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        // User is logged in, set the user object
        setUser(currentUser);
        // Now, fetch their profile from Firestore
        const userDocRef = doc(firestore, 'team', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          // Handle case where user exists in Auth but not in Firestore 'team' collection
          setUserProfile(null); 
        }
      } else {
        // User is logged out
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    logout,
  };

  // We don't render anything until the initial loading state is resolved
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};