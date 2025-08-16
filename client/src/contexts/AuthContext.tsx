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
  isDemo?: boolean;
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
    // Check for demo user first
    const demoUser = localStorage.getItem('demo-user');
    if (demoUser) {
      try {
        const parsedDemoUser = JSON.parse(demoUser);
        setUser({
          uid: parsedDemoUser.uid,
          profile: parsedDemoUser,
          isDemo: true,
        } as AuthUser);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing demo user:', error);
        localStorage.removeItem('demo-user');
      }
    }

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
