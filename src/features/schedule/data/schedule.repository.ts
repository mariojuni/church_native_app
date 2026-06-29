import { collection, doc, onSnapshot, orderBy, query, runTransaction } from 'firebase/firestore';
import { db } from '../../../firebase';
import type { Duty, Rsvp, Schedule } from '../domain/schedule.types';

type SchedulesListener = (schedules: Schedule[]) => void;
type ErrorListener = (error: Error) => void;

function toDuty(value: unknown): Duty | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (typeof item.userId !== 'string' || typeof item.role !== 'string' || typeof item.status !== 'string') {
    return null;
  }

  return {
    userId: item.userId,
    role: item.role,
    status: item.status,
  };
}

function toRsvp(value: unknown): Rsvp | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (typeof item.userId !== 'string' || typeof item.status !== 'string') {
    return null;
  }

  if (item.status !== 'going' && item.status !== 'maybe' && item.status !== 'not_going') {
    return null;
  }

  return {
    userId: item.userId,
    status: item.status,
  };
}

function toSchedule(docId: string, data: Record<string, unknown>): Schedule {
  const duties = Array.isArray(data.duties) ? data.duties.map(toDuty).filter((duty): duty is Duty => duty !== null) : [];
  const rsvps = Array.isArray(data.rsvps) ? data.rsvps.map(toRsvp).filter((rsvp): rsvp is Rsvp => rsvp !== null) : [];

  return {
    id: docId,
    event: typeof data.event === 'string' ? data.event : '',
    date: typeof data.date === 'string' ? data.date : docId,
    time: typeof data.time === 'string' ? data.time : '',
    endTime: typeof data.endTime === 'string' ? data.endTime : '',
    location: typeof data.location === 'string' ? data.location : '',
    duties,
    rsvps,
    createdAt: data.createdAt,
  };
}

export const scheduleRepository = {
  subscribeToSchedules(onData: SchedulesListener, onError: ErrorListener): () => void {
    const scheduleQuery = query(collection(db, 'schedules'), orderBy('date', 'asc'));

    return onSnapshot(
      scheduleQuery,
      (snapshot) => {
        const schedules = snapshot.docs.map((docSnap) => toSchedule(docSnap.id, docSnap.data() as Record<string, unknown>));
        onData(schedules);
      },
      (error) => onError(error)
    );
  },

  async updateRsvp(eventId: string, userId: string, status: Rsvp['status']): Promise<void> {
    const scheduleDocRef = doc(db, 'schedules', eventId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(scheduleDocRef);
      if (!snapshot.exists()) {
        throw new Error(`Schedule with id "${eventId}" was not found`);
      }

      const data = snapshot.data();
      const currentRsvps = Array.isArray(data.rsvps)
        ? data.rsvps.map(toRsvp).filter((rsvp): rsvp is Rsvp => rsvp !== null)
        : [];

      const existingIndex = currentRsvps.findIndex((rsvp) => rsvp.userId === userId);
      if (existingIndex >= 0) {
        currentRsvps[existingIndex] = { userId, status };
      } else {
        currentRsvps.push({ userId, status });
      }

      transaction.update(scheduleDocRef, { rsvps: currentRsvps });
    });
  },

  async updateMinisterialDuty(eventId: string, userId: string, action: 'accept' | 'cancel'): Promise<void> {
    const scheduleDocRef = doc(db, 'schedules', eventId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(scheduleDocRef);
      if (!snapshot.exists()) {
        throw new Error(`Schedule with id "${eventId}" was not found`);
      }

      const data = snapshot.data();
      const duties = Array.isArray(data.duties)
        ? data.duties.map(toDuty).filter((duty): duty is Duty => duty !== null)
        : [];
      const index = duties.findIndex((duty) => duty.userId === userId);

      if (index >= 0) {
        duties[index] = {
          ...duties[index],
          status: action === 'accept' ? 'accepted' : 'declined',
        };
      }

      transaction.update(scheduleDocRef, { duties });
    });
  },

  async dismissNotification(eventId: string, userId: string, currentStatus: string): Promise<void> {
    const scheduleDocRef = doc(db, 'schedules', eventId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(scheduleDocRef);
      if (!snapshot.exists()) {
        throw new Error(`Schedule with id "${eventId}" was not found`);
      }

      const data = snapshot.data();
      const duties = Array.isArray(data.duties)
        ? data.duties.map(toDuty).filter((duty): duty is Duty => duty !== null)
        : [];
      const index = duties.findIndex((duty) => duty.userId === userId);

      if (index >= 0) {
        if (currentStatus === 'accepted') {
          duties[index] = { ...duties[index], status: 'accepted_dismissed' };
        } else if (currentStatus === 'declined') {
          duties[index] = { ...duties[index], status: 'declined_dismissed' };
        }
      }

      transaction.update(scheduleDocRef, { duties });
    });
  },
};

