import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        
        // Set up real-time listener immediately
        unsubProfile = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setLoading(false);
            setIsAuthReady(true);
          } else {
            // AUTO-PROVISION ADMIN: Case-insensitive check
            const isAdminEmail = firebaseUser.email?.toLowerCase() === 'HASSANYAKUBUBABAGASA@gmail.com'.toLowerCase();
            
            if (isAdminEmail) {
              const adminProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: 'System Administrator',
                email: firebaseUser.email!,
                role: 'admin',
                department: 'ICT Management',
                createdAt: new Date().toISOString(),
              };
              
              try {
                await setDoc(docRef, {
                  ...adminProfile,
                  createdAt: serverTimestamp()
                });
                setProfile(adminProfile);
              } catch (e) {
                console.error("Failed to auto-provision admin:", e);
              }
            } else {
              setProfile(null);
            }
            setLoading(false);
            setIsAuthReady(true);
          }
        }, (error) => {
          console.error("Profile listener error:", error);
          setLoading(false);
          setIsAuthReady(true);
        });

        // Also do a one-time fetch to be sure
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
          setIsAuthReady(true);
        } catch (e) {
          console.error("Error fetching profile:", e);
          setLoading(false);
          setIsAuthReady(true);
        }
      } else {
        if (unsubProfile) unsubProfile();
        setProfile(null);
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
