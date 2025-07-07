import React, { createContext, useState, useEffect, useContext } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { TeamMember } from '../types';

interface ProfileContextProps {
  profile: TeamMember | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextProps>({
  profile: null,
  profileLoading: true,
  refreshProfile: async () => undefined,
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TeamMember | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const db = getFirestore();

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const docRef = doc(db, 'team', user.uid);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      setProfile(snapshot.data() as TeamMember);
    } else {
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    setProfileLoading(true);
    await fetchProfile();
    setProfileLoading(false);
  };

  useEffect(() => {
    // Whenever user changes, fetch updated profile
    setProfileLoading(true);
    fetchProfile().then(() => setProfileLoading(false));
  }, [user]);

  return (
    <ProfileContext.Provider value={{ profile, profileLoading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export function useProfile() {
  return useContext(ProfileContext);
}