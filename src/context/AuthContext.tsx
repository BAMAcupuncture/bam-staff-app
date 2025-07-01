import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { TeamMember } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: TeamMember | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  error: null
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setError(null);
      
      if (user) {
        try {
          // Method 1: Try to find by document ID (user.uid) - This is the preferred method
          const teamDocRef = doc(db, 'team', user.uid);
          const teamDoc = await getDoc(teamDocRef);
          
          if (teamDoc.exists()) {
            setUserProfile({ id: teamDoc.id, ...teamDoc.data() } as TeamMember);
          } else {
            // Method 2: Try to find by uid field (fallback for existing data)
            const teamQuery = query(
              collection(db, 'team'), 
              where('uid', '==', user.uid)
            );
            const teamSnapshot = await getDocs(teamQuery);
            
            if (!teamSnapshot.empty) {
              const doc = teamSnapshot.docs[0];
              setUserProfile({ id: doc.id, ...doc.data() } as TeamMember);
            } else {
              // Method 3: Try to find by email (final fallback)
              const emailQuery = query(
                collection(db, 'team'), 
                where('email', '==', user.email)
              );
              const emailSnapshot = await getDocs(emailQuery);
              
              if (!emailSnapshot.empty) {
                const doc = emailSnapshot.docs[0];
                setUserProfile({ id: doc.id, ...doc.data() } as TeamMember);
              } else {
                setUserProfile(null);
                setError('No profile found in team collection. Please contact your administrator.');
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          setError(`Database error: ${error.message}`);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};