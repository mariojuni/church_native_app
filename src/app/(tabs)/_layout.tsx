import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { CustomTabBar } from '@/features/navigation/presentation/components/CustomTabBar';
import { getTabScreens } from '@/features/navigation/presentation/tabNavigation';
import { useAuthStore } from '../../store/useAuthStore';

export default function TabLayout() {
  const userProfile = useAuthStore((state) => state.userProfile);
  const isStaff = userProfile?.role?.toLowerCase() === 'staff';
  const tabScreens = getTabScreens(isStaff);

  return (
    <View style={{ flex: 1 }}>
      <Tabs 
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar tabBarProps={props} isStaff={isStaff} />}
      >
        {tabScreens.map((screen) => (
          <Tabs.Screen key={screen.name} name={screen.name} options={screen.options} />
        ))}
      </Tabs>
    </View>
  );
}
