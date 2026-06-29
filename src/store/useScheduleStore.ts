import { create } from 'zustand';
import { collection, query, orderBy, onSnapshot, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Duty {
  role: string;
  userId: string;
  status: string;
}

export interface Rsvp {
  userId: string;
  status: 'going' | 'maybe' | 'not_going';
}

export interface Schedule {
  id: string;
  event: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  duties: Duty[];
  rsvps: Rsvp[];
  createdAt?: any;
}

interface ScheduleStore {
  schedules: Schedule[];
  schedulesLoading: boolean;
  initializeSchedulesListener: () => () => void;
}

// ─── Utilities ──────────────────────────────────────────────────────────────

/**
 * Parses a time string like "09:00 AM" into 24h "HH:mm" format.
 */
export function parseTimeTo24h(timeStr: string): string {
  if (!timeStr) return '09:00';
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return timeStr;
  const [, hours, minutes, modifier] = match;
  let h = parseInt(hours, 10);
  if (modifier.toUpperCase() === 'PM' && h < 12) h += 12;
  if (modifier.toUpperCase() === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Returns only upcoming schedules (today's events still in progress + future),
 * sorted by date then start time.
 */
export function getUpcomingSchedules(schedules: Schedule[], maxCount = 5): Schedule[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return schedules
    .filter(s => {
      if (s.date > todayStr) return true;
      if (s.date < todayStr) return false;

      // Today's events: check if event has ended
      let endTimeParsed = parseTimeTo24h(s.endTime || s.time);
      if (!s.endTime) {
        // Fallback: assume event lasts 2 hours
        let h = parseInt(endTimeParsed.split(':')[0], 10) + 2;
        if (h > 23) h = 23;
        endTimeParsed = `${String(h).padStart(2, '0')}:${endTimeParsed.split(':')[1]}`;
      }
      return endTimeParsed >= currentTimeStr;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return parseTimeTo24h(a.time).localeCompare(parseTimeTo24h(b.time));
    })
    .slice(0, maxCount);
}

/**
 * Extracts the current user's ministerial duty roles from a schedule.
 * Filters out legacy "Attendee" entries that may exist in old data.
 * Returns null if the user has no ministerial duties.
 */
export function getUserMinisterialRoles(schedule: Schedule, userId: string): string | null {
  if (!schedule.duties || !Array.isArray(schedule.duties)) return null;

  const myDuties = schedule.duties.filter(
    (d) => 
      d.userId === userId && 
      d.role.toLowerCase() !== 'attendee' && 
      d.status !== 'declined' && 
      d.status !== 'declined_dismissed'
  );

  if (myDuties.length === 0) return null;
  return myDuties.map(d => d.role).join(', ');
}

/**
 * Gets the current user's RSVP status for a schedule.
 * Checks the `rsvps` array first (new structure), then falls back to
 * looking in `duties` for legacy "Attendee" entries.
 */
export function getUserRsvpStatus(schedule: Schedule, userId: string): string | null {
  // New structure: check rsvps array
  if (schedule.rsvps && Array.isArray(schedule.rsvps)) {
    const myRsvp = schedule.rsvps.find(r => r.userId === userId);
    if (myRsvp) return myRsvp.status;
  }

  // Legacy fallback: check duties for "Attendee" role
  if (schedule.duties && Array.isArray(schedule.duties)) {
    const attendeeDuty = schedule.duties.find(
      d => d.userId === userId && d.role.toLowerCase() === 'attendee'
    );
    if (attendeeDuty) return attendeeDuty.status;
  }

  return null;
}

/**
 * Returns deduplicated ministerial team members (unique by userId).
 * Excludes legacy "Attendee" entries.
 */
export function getMinisterialTeam(schedule: Schedule): Duty[] {
  if (!schedule.duties || !Array.isArray(schedule.duties)) return [];

  const seen = new Set<string>();
  return schedule.duties.filter(duty => {
    if (!duty.userId) return false;
    if (duty.role.toLowerCase() === 'attendee') return false;
    if (duty.status === 'declined' || duty.status === 'declined_dismissed') return false;
    if (seen.has(duty.userId)) return false;
    seen.add(duty.userId);
    return true;
  });
}

/**
 * Updates the user's RSVP status in the `rsvps` array (not duties).
 * Uses a Firestore transaction for safe concurrent writes.
 */
export async function updateRsvp(eventId: string, userId: string, status: string): Promise<void> {
  const docRef = doc(db, 'schedules', eventId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(docRef);
    if (!snapshot.exists()) return;

    const data = snapshot.data();
    const rsvps: Rsvp[] = data.rsvps ? [...data.rsvps] : [];

    const existingIndex = rsvps.findIndex(r => r.userId === userId);
    if (existingIndex >= 0) {
      rsvps[existingIndex] = { userId, status: status as Rsvp['status'] };
    } else {
      rsvps.push({ userId, status: status as Rsvp['status'] });
    }

    transaction.update(docRef, { rsvps });
  });
}

/**
 * Updates the user's RSVP status in the `rsvps` array (not duties).
 * Uses a Firestore transaction for safe concurrent writes.
 */
export async function updateMinisterialDuty(eventId: string, userId: string, action: 'accept' | 'cancel'): Promise<void> {
  const docRef = doc(db, 'schedules', eventId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(docRef);
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    const duties: Duty[] = data.duties ? [...data.duties] : [];

    if (action === 'accept') {
      const idx = duties.findIndex(d => d.userId === userId);
      if (idx >= 0) {
        duties[idx] = { ...duties[idx], status: 'accepted' };
      }
    } else if (action === 'cancel') {
      const idx = duties.findIndex(d => d.userId === userId);
      if (idx >= 0) {
        duties[idx] = { ...duties[idx], status: 'declined' };
      }
    }
    transaction.update(docRef, { duties });
  });
}

/**
 * Dismisses a notification for an accepted or declined duty.
 * Changes 'accepted' -> 'accepted_dismissed' and 'declined' -> 'declined_dismissed'
 */
export async function dismissNotification(eventId: string, userId: string, currentStatus: string): Promise<void> {
  const docRef = doc(db, 'schedules', eventId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(docRef);
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    const duties: Duty[] = data.duties ? [...data.duties] : [];

    const idx = duties.findIndex(d => d.userId === userId);
    if (idx >= 0) {
      if (currentStatus === 'accepted') {
        duties[idx] = { ...duties[idx], status: 'accepted_dismissed' };
      } else if (currentStatus === 'declined') {
        duties[idx] = { ...duties[idx], status: 'declined_dismissed' };
      }
    }
    transaction.update(docRef, { duties });
  });
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useScheduleStore = create<ScheduleStore>((set) => ({
  schedules: [],
  schedulesLoading: true,

  initializeSchedulesListener: () => {
    const q = query(collection(db, 'schedules'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsed: Schedule[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          event: data.event || '',
          date: data.date || docSnap.id,
          time: data.time || '',
          endTime: data.endTime || '',
          location: data.location || '',
          duties: data.duties || [],
          rsvps: data.rsvps || [],
          createdAt: data.createdAt,
        };
      });
      set({ schedules: parsed, schedulesLoading: false });
    }, (error) => {
      console.error('Error fetching schedules:', error);
      set({ schedulesLoading: false });
    });

    return unsubscribe;
  },
}));
