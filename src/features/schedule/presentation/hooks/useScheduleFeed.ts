import { useCallback, useEffect, useState } from 'react';
import { scheduleRepository } from '../../data/schedule.repository';
import type { Rsvp, Schedule } from '../../domain/schedule.types';

export function useScheduleFeed() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = scheduleRepository.subscribeToSchedules(
      (nextSchedules) => {
        setSchedules(nextSchedules);
        setSchedulesLoading(false);
      },
      (error) => {
        console.error('Error fetching schedules:', error);
        setSchedulesLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const updateRsvp = useCallback(async (eventId: string, userId: string, status: Rsvp['status']) => {
    await scheduleRepository.updateRsvp(eventId, userId, status);
  }, []);

  const updateMinisterialDuty = useCallback(async (eventId: string, userId: string, action: 'accept' | 'cancel') => {
    await scheduleRepository.updateMinisterialDuty(eventId, userId, action);
  }, []);

  const dismissNotification = useCallback(async (eventId: string, userId: string, currentStatus: string) => {
    await scheduleRepository.dismissNotification(eventId, userId, currentStatus);
  }, []);

  return {
    schedules,
    schedulesLoading,
    updateRsvp,
    updateMinisterialDuty,
    dismissNotification,
  };
}

