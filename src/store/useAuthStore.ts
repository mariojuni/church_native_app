import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthState {
  currentUser: User | null;
  userProfile: any | null;
  loading: boolean;
  initialized: boolean;
  signup: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<void>;
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
    // Placeholder until Expo OAuth / Google Client IDs are provided
    return Promise.resolve();
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
