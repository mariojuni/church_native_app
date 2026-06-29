import { getUndismissedDutyNotificationsForAdmin } from '@/features/schedule/domain/schedule.selectors';
import { useMemberStore } from '@/store/useMemberStore';
import { dismissNotification, useScheduleStore } from '@/store/useScheduleStore';
import { useMemo } from 'react';

export type StaffNotificationViewModel = {
  action: 'accepted' | 'declined';
  date: string;
  dateObj: Date;
  event: string;
  id: string;
  role: string;
  scheduleId: string;
  userId: string;
  userName: string;
};

export function useStaffNotifications() {
  const schedules = useScheduleStore((state) => state.schedules);
  const members = useMemberStore((state) => state.members);

  const notifications = useMemo<StaffNotificationViewModel[]>(() => {
    const items = getUndismissedDutyNotificationsForAdmin(schedules);
    return items
      .map((item) => {
        const member = members.find((m) => m.id === item.userId);
        if (!member) return null;
        return {
          id: item.notificationId,
          scheduleId: item.scheduleId,
          userId: item.userId,
          userName: member.name || member.displayName || 'Unknown Member',
          action: item.action,
          role: item.role,
          date: item.date,
          event: item.event,
          dateObj: item.dateObj,
        };
      })
      .filter((value): value is StaffNotificationViewModel => value !== null);
  }, [members, schedules]);

  return { dismissNotification, notifications };
}
