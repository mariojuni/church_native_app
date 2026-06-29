import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import type { AuthCredentialResult, UserProfile } from '../domain/auth.types';

GoogleSignin.configure({
  webClientId: '676505939287-eqsoa6bc8tkgkun3bmqtdmu2418hnu7m.apps.googleusercontent.com',
});

async function fetchUserProfile(user: User): Promise<UserProfile | null> {
  const profileDocRef = doc(db, 'users', user.uid);
  const profileSnapshot = await getDoc(profileDocRef);
  if (!profileSnapshot.exists()) return null;
  return {
    uid: user.uid,
    ...(profileSnapshot.data() as Omit<UserProfile, 'uid'>),
  };
}

export const authRepository = {
  signup(email: string, password: string): Promise<AuthCredentialResult> {
    return createUserWithEmailAndPassword(auth, email, password);
  },

  login(email: string, password: string): Promise<AuthCredentialResult> {
    return signInWithEmailAndPassword(auth, email, password);
  },

  async loginWithGoogle(): Promise<AuthCredentialResult> {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;

    if (!idToken) {
      throw new Error('No ID token found from Google Sign-In');
    }

    const googleCredential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, googleCredential);
  },

  logout(): Promise<void> {
    return signOut(auth);
  },

  subscribeToAuthState(
    onData: (data: { user: User | null; profile: UserProfile | null }) => void,
    onError: (error: Error) => void
  ): () => void {
    return onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          onData({ user: null, profile: null });
          return;
        }

        try {
          const profile = await fetchUserProfile(user);
          onData({ user, profile });
        } catch (error) {
          onError(error as Error);
          onData({ user, profile: null });
        }
      },
      onError
    );
  },
};
