import type { Timestamp } from 'firebase/firestore';

export type PrayerFilter = 'Recent' | 'My Requests' | 'Answered';

export interface Prayer {
  id: string;
  name: string;
  request: string;
  userId: string;
  answered: boolean;
  likes: number;
  likedBy: string[];
  createdAt?: Timestamp | Date | number | null;
}

