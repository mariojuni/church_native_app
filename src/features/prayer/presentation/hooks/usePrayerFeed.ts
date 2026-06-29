import { useCallback, useEffect, useState } from 'react';
import { prayerRepository } from '../../data/prayer.repository';
import type { Prayer } from '../../domain/prayer.types';

export function usePrayerFeed() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = prayerRepository.subscribeToPrayers(
      (nextPrayers) => {
        setPrayers(nextPrayers);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching prayers:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const togglePrayerLike = useCallback(async (prayerId: string, userId: string) => {
    await prayerRepository.togglePrayerLike(prayerId, userId);
  }, []);

  const togglePrayerAnswered = useCallback(async (prayerId: string, currentValue: boolean) => {
    await prayerRepository.togglePrayerAnswered(prayerId, currentValue);
  }, []);

  return {
    prayers,
    loading,
    togglePrayerLike,
    togglePrayerAnswered,
  };
}

