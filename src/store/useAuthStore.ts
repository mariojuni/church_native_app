import type { User } from 'firebase/auth';
import { create } from 'zustand';
import { authRepository } from '../features/auth/data/auth.repository';
import type { AuthCredentialResult, UserProfile } from '../features/auth/domain/auth.types';

interface AuthState {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  signup: (email: string, password: string) => Promise<AuthCredentialResult>;
  login: (email: string, password: string) => Promise<AuthCredentialResult>;
  loginWithGoogle: () => Promise<AuthCredentialResult>;
  logout: () => Promise<void>;
  initializeAuthListener: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  userProfile: null,
  loading: true,
  initialized: false,
  signup: (email, password) => authRepository.signup(email, password),
  login: (email, password) => authRepository.login(email, password),
  loginWithGoogle: async () => {
    try {
      return await authRepository.loginWithGoogle();
    } catch (error) {
      console.error("Google Sign-In Error", error);
      throw error;
    }
  },
  logout: () => authRepository.logout(),
  initializeAuthListener: () => {
    authRepository.subscribeToAuthState(
      ({ user, profile }) => {
        set({
          currentUser: user,
          userProfile: profile,
          loading: false,
          initialized: true,
        });
      },
      (error) => {
        console.error('Error listening to auth state:', error);
        set({ loading: false, initialized: true });
      }
    );
  }
}));
