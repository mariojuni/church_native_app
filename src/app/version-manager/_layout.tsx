
import { Stack } from 'expo-router';
import { VersionProvider } from './_context';

export default function VersionManagerLayout() {
  return (
    <VersionProvider>
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
    </VersionProvider>
  );
}
