import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, getUserDocument, createUserDocument } from '../lib/firebase';

interface AuthUser extends FirebaseUser {
  profile?: {
    name: string;
    phone: string;
    role: string;
    lang: string;
    guardians: Array<{ name: string; phone: string }>;
    pushTokens: string[];
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  updateUserProfile: (profile: any) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserDocument(firebaseUser.uid);
          setUser({
            ...firebaseUser,
            profile,
          } as AuthUser);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(firebaseUser as AuthUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserProfile = async (profileData: any) => {
    if (user) {
      try {
        await createUserDocument(user.uid, profileData);
        const updatedProfile = await getUserDocument(user.uid);
        setUser({
          ...user,
          profile: updatedProfile,
        } as AuthUser);
      } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
    }
  };

  const value = {
    user,
    loading,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
