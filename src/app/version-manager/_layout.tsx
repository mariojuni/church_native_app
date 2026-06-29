
import { VersionProvider } from '@/features/bible/presentation/context/VersionManagerContext';
import { styles } from '@/features/bible/presentation/version-manager/styles';
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function VersionManagerLayout() {
  return (
    <VersionProvider>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fff' }
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="discover" />
          <Stack.Screen name="language" />
          <Stack.Screen name="detail" />
        </Stack>
        <View style={{ position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center', zIndex: 999 }} pointerEvents="none">
          <View style={styles.dragHandle} />
        </View>
      </View>
    </VersionProvider>
  );
}
