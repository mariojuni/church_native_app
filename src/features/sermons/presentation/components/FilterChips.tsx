import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Video, Mic, Layers, Grid3x3 } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { Colors, Spacing } from '@/constants/theme';
import type { SermonFilter } from '../../domain/sermon.types';

interface FilterChipsProps {
  activeFilter: SermonFilter;
  onFilterChange: (filter: SermonFilter) => void;
}

const FILTERS: Array<{ value: SermonFilter; label: string; icon: typeof Video }> = [
  { value: 'all', label: 'All', icon: Grid3x3 },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'audio', label: 'Audio', icon: Mic },
  { value: 'series', label: 'Series', icon: Layers },
];

export function FilterChips({ activeFilter, onFilterChange }: FilterChipsProps) {
  const colors = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.value;
        const Icon = filter.icon;

        return (
          <TouchableOpacity
            key={filter.value}
            onPress={() => onFilterChange(filter.value)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? '#FF6596' : colors.backgroundElement,
                borderColor: isActive ? '#FF6596' : 'transparent',
              },
            ]}
            activeOpacity={0.7}
          >
            <Icon
              size={16}
              color={isActive ? '#FFF' : colors.text}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.chipText,
                { color: isActive ? '#FFF' : colors.text },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
