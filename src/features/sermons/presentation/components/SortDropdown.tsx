import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, useColorScheme } from 'react-native';
import { useState } from 'react';
import { ArrowUpDown, Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { Colors, Spacing } from '@/constants/theme';
import type { SermonSort } from '../../domain/sermon.types';

interface SortDropdownProps {
  activeSort: SermonSort;
  onSortChange: (sort: SermonSort) => void;
  iconOnly?: boolean;
}

const SORT_OPTIONS: Array<{ value: SermonSort; label: string }> = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'alphabetical', label: 'A-Z' },
];

export function SortDropdown({ activeSort, onSortChange, iconOnly = false }: SortDropdownProps) {
  const colors = useTheme();
  const colorScheme = useColorScheme();
  const [isOpen, setIsOpen] = useState(false);

  const activeLabel = SORT_OPTIONS.find((opt) => opt.value === activeSort)?.label || 'Newest First';

  const handleSelect = (sort: SermonSort) => {
    onSortChange(sort);
    setIsOpen(false);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={[styles.trigger, { backgroundColor: colors.backgroundElement }]}
        activeOpacity={0.7}
      >
        <ArrowUpDown size={16} color={colors.text} />
        {!iconOnly && (
          <Text style={[styles.triggerText, { color: colors.text }]}>
            {activeLabel}
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFF',
              },
            ]}
          >
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>
              Sort By
            </Text>

            {SORT_OPTIONS.map((option) => {
              const isActive = activeSort === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  style={[
                    styles.option,
                    { backgroundColor: isActive ? colors.backgroundElement : 'transparent' },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: isActive ? '#FF6596' : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isActive && <Check size={18} color="#FF6596" strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    gap: 6,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  dropdown: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    padding: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.one,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    marginBottom: 2,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
