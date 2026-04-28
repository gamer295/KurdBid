import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  isAdmin: boolean;
  adminRank?: 'Super' | 'Moderator' | 'Support';
  isBanned: boolean;
  bannedUntil: string | null;
  bio?: string;
  location?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);
  const adminPromoAttempted = React.useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Essential: Set local admin state immediately for the master account
        if (user.email?.toLowerCase() === 'hazar.qader@gmail.com') {
          setIsAdmin(true);
        }

        // Handle User Profile and Admin check
        const userDocRef = doc(db, 'users', user.uid);
        
        const setupProfileListener = () => {
          return onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              if (data.isAdmin) setIsAdmin(true);
              
              if (user.email?.toLowerCase() === 'hazar.qader@gmail.com' && !data.isAdmin && !adminPromoAttempted.current) {
                adminPromoAttempted.current = true;
                setDoc(userDocRef, { isAdmin: true }, { merge: true }).catch(e => {
                  console.error("Error setting master admin flag:", e);
                });
              }
              setProfile(data);
              setLoading(false);
            }
          }, (error) => {
            console.error("Auth Profile Listener Error:", error);
            setLoading(false);
          });
        };

        const initialFetch = async () => {
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            // New user initial setup
            let baseName = user.displayName || 'Guest';
            
            // Unique Name Check for new users
            const q = query(collection(db, 'users'), where('displayName', '==', baseName));
            const snapshots = await getDocs(q);
            if (!snapshots.empty) {
              baseName = `${baseName}#${Math.floor(1000 + Math.random() * 9000)}`;
            }

            const isUserAdmin = baseName === 'KurdBid' || user.email?.toLowerCase() === 'hazar.qader@gmail.com';
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: baseName,
              email: user.email || '',
              photoURL: user.photoURL || '',
              isAdmin: isUserAdmin,
              isBanned: false,
              bannedUntil: null,
              bio: '',
              location: '',
              phone: ''
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
            if (isUserAdmin) setIsAdmin(true);
          }
          const unsub = setupProfileListener();
          return unsub;
        };

        const unsubPromise = initialFetch();
        
        return () => {
          unsubPromise.then(unsub => unsub());
        };
      } else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = () => auth.signOut();

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error("Email/Password is not enabled in Firebase Console. Please go to Auth > Sign-in method and enable 'Email/Password' (not Email Link).");
      }
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error("Email/Password is not enabled in Firebase Console. Please go to Auth > Sign-in method and enable 'Email/Password' (not Email Link).");
      }
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    // Remove internal fields that shouldn't be updated by user
    const { isAdmin, isBanned, bannedUntil, uid, email, ...updatableData } = data as any;
    await setDoc(userDocRef, updatableData, { merge: true });
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signOut, signUpWithEmail, signInWithEmail, resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
