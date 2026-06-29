import type { Duty, Schedule } from './schedule.types';

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
    .filter((schedule) => {
      if (schedule.date > todayStr) return true;
      if (schedule.date < todayStr) return false;

      let endTimeParsed = parseTimeTo24h(schedule.endTime || schedule.time);
      if (!schedule.endTime) {
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
    (duty) =>
      duty.userId === userId &&
      duty.role.toLowerCase() !== 'attendee' &&
      duty.status !== 'declined' &&
      duty.status !== 'declined_dismissed'
  );

  if (myDuties.length === 0) return null;
  return myDuties.map((duty) => duty.role).join(', ');
}

/**
 * Gets the current user's RSVP status for a schedule.
 * Checks the `rsvps` array first (new structure), then falls back to
 * looking in `duties` for legacy "Attendee" entries.
 */
export function getUserRsvpStatus(schedule: Schedule, userId: string): string | null {
  if (schedule.rsvps && Array.isArray(schedule.rsvps)) {
    const myRsvp = schedule.rsvps.find((rsvp) => rsvp.userId === userId);
    if (myRsvp) return myRsvp.status;
  }

  if (schedule.duties && Array.isArray(schedule.duties)) {
    const attendeeDuty = schedule.duties.find(
      (duty) => duty.userId === userId && duty.role.toLowerCase() === 'attendee'
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
  return schedule.duties.filter((duty) => {
    if (!duty.userId) return false;
    if (duty.role.toLowerCase() === 'attendee') return false;
    if (duty.status === 'declined' || duty.status === 'declined_dismissed') return false;
    if (seen.has(duty.userId)) return false;
    seen.add(duty.userId);
    return true;
  });
}

/**
 * Returns upcoming schedules where the user has active ministerial duties,
 * ordered by date and time.
 */
export function getUpcomingMinisterialDuties(schedules: Schedule[], userId: string): Schedule[] {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return schedules
    .filter((schedule) => {
      if (schedule.date < todayStr) return false;
      return getUserMinisterialRoles(schedule, userId) !== null;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || '').localeCompare(b.time || '');
    });
}

export function getUndismissedNotificationCount(schedules: Schedule[]): number {
  return schedules
    .flatMap((schedule) => schedule.duties || [])
    .filter((duty) => duty.status === 'accepted' || duty.status === 'declined').length;
}

export type StaffDutyNotification = {
  action: 'accepted' | 'declined';
  date: string;
  dateObj: Date;
  event: string;
  notificationId: string;
  role: string;
  scheduleId: string;
  userId: string;
};

export function getUndismissedDutyNotificationsForAdmin(schedules: Schedule[]): StaffDutyNotification[] {
  return schedules
    .flatMap((schedule) => {
      if (!schedule.duties) return [];

      return schedule.duties
        .filter((duty) => duty.status === 'accepted' || duty.status === 'declined')
        .map<StaffDutyNotification>((duty) => ({
          action: duty.status === 'accepted' ? 'accepted' : 'declined',
          date: new Date(`${schedule.date}T00:00:00`).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          dateObj: new Date(`${schedule.date}T00:00:00`),
          event: schedule.event || 'Sunday Worship Service',
          notificationId: `${schedule.id}-${duty.userId}-${duty.status}`,
          role: duty.role,
          scheduleId: schedule.id,
          userId: duty.userId,
        }));
    })
    .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
}
