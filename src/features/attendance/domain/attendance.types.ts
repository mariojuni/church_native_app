import type { FieldValue, Timestamp } from 'firebase/firestore';

export interface AttendanceCheckin {
  id: string;
  userId: string;
  name: string;
  role: string;
  status: string;
  date: string;
  type: string;
  timestamp?: Timestamp | Date | number | null;
}

export interface CreateAttendanceCheckinInput {
  userId: string;
  name: string;
  role: string;
  status: string;
  date: string;
  type: 'member';
  timestamp: FieldValue;
}

