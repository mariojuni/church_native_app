import type { User, UserCredential } from 'firebase/auth';

export type AuthCredentialResult = UserCredential;

export interface UserProfile {
  uid: string;
  name?: string;
  displayName?: string;
  role?: string;
  avatar?: string;
  [key: string]: unknown;
}

export interface AuthStateSnapshot {
  user: User | null;
  profile: UserProfile | null;
}
