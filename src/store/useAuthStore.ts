import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '676505939287-eqsoa6bc8tkgkun3bmqtdmu2418hnu7m.apps.googleusercontent.com',
});

interface AuthState {
  currentUser: User | null;
  userProfile: any | null;
  loading: boolean;
  initialized: boolean;
  signup: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  initializeAuthListener: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  userProfile: null,
  loading: true,
  initialized: false,
  signup: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  login: (email, password) => signInWithEmailAndPassword(auth, email, password),
  loginWithGoogle: async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      
      if (!idToken) {
        throw new Error('No ID token found from Google Sign-In');
      }
      
      const googleCredential = GoogleAuthProvider.credential(idToken);
      return signInWithCredential(auth, googleCredential);
    } catch (error) {
      console.error("Google Sign-In Error", error);
      throw error;
    }
  },
  logout: () => signOut(auth),
  initializeAuthListener: () => {
    onAuthStateChanged(auth, async (user) => {
      set({ currentUser: user });
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            set({ userProfile: docSnap.data() });
          } else {
            set({ userProfile: null });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          set({ userProfile: null });
        }
      } else {
        set({ userProfile: null });
      }
      set({ loading: false, initialized: true });
    });
  }
}));
