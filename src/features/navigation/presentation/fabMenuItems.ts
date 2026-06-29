import type { LucideIcon } from 'lucide-react-native';
import { Calendar, ClipboardCheck } from 'lucide-react-native';

export type FabMenuItem = {
  icon: LucideIcon;
  key: string;
  route: string;
  title: string;
};

export function getFabMenuItems(isStaff: boolean): FabMenuItem[] {
  if (!isStaff) return [];

  return [
    { key: 'add-schedule', title: 'Add Schedule', route: '/(tabs)/', icon: Calendar },
    { key: 'attendance', title: 'Attendance', route: '/(tabs)/attendance', icon: ClipboardCheck },
  ];
}
