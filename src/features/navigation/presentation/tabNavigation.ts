import type { LucideIcon } from 'lucide-react-native';
import { Activity, Book, HeartHandshake, Home, Play } from 'lucide-react-native';

export type AppTabRouteName = 'index' | 'bible' | 'sermons' | 'prayer' | 'attendance';

export type TabScreenConfig = {
  name: AppTabRouteName;
  options: {
    href?: '/(tabs)/attendance' | null;
    title: string;
  };
};

const TAB_ICON_BY_ROUTE: Record<AppTabRouteName, LucideIcon> = {
  index: Home,
  bible: Book,
  sermons: Play,
  prayer: HeartHandshake,
  attendance: Activity,
};

export function getTabIcon(routeName: string): LucideIcon {
  return TAB_ICON_BY_ROUTE[routeName as AppTabRouteName] || Home;
}

export function getTabScreens(isStaff: boolean): TabScreenConfig[] {
  return [
    { name: 'index', options: { title: 'Home' } },
    { name: 'bible', options: { title: 'Bible' } },
    { name: 'sermons', options: { title: 'Sermons' } },
    { name: 'prayer', options: { title: 'Prayer' } },
    {
      name: 'attendance',
      options: {
        title: 'Staff',
        href: isStaff ? '/(tabs)/attendance' : null,
      },
    },
  ];
}
