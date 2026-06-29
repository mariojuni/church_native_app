import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { sortCheckinsByNewest } from '../domain/attendance.selectors';
import type { AttendanceCheckin, CreateAttendanceCheckinInput } from '../domain/attendance.types';

type CheckinsListener = (checkins: AttendanceCheckin[]) => void;
type ErrorListener = (error: Error) => void;

function toCheckinModel(id: string, data: Record<string, unknown>): AttendanceCheckin {
  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    name: typeof data.name === 'string' ? data.name : '',
    role: typeof data.role === 'string' ? data.role : '',
    status: typeof data.status === 'string' ? data.status : '',
    date: typeof data.date === 'string' ? data.date : '',
    type: typeof data.type === 'string' ? data.type : '',
    timestamp: (data.timestamp as AttendanceCheckin['timestamp']) ?? null,
  };
}

export const attendanceRepository = {
  subscribeByDate(date: string, onData: CheckinsListener, onError: ErrorListener): () => void {
    const attendanceQuery = query(collection(db, 'attendance'), where('date', '==', date));

    return onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const checkins = snapshot.docs.map((docSnap) => toCheckinModel(docSnap.id, docSnap.data() as Record<string, unknown>));
        onData(sortCheckinsByNewest(checkins));
      },
      (error) => onError(error)
    );
  },

  subscribeMemberCheckinsByDate(date: string, onData: CheckinsListener, onError: ErrorListener): () => void {
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('date', '==', date),
      where('type', '==', 'member')
    );

    return onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const checkins = snapshot.docs.map((docSnap) => toCheckinModel(docSnap.id, docSnap.data() as Record<string, unknown>));
        onData(sortCheckinsByNewest(checkins));
      },
      (error) => onError(error)
    );
  },

  async createMemberCheckin(input: Omit<CreateAttendanceCheckinInput, 'timestamp'>): Promise<void> {
    await addDoc(collection(db, 'attendance'), {
      ...input,
      timestamp: serverTimestamp(),
    });
  },

  async deleteCheckin(checkinId: string): Promise<void> {
    await deleteDoc(doc(db, 'attendance', checkinId));
  },
};

