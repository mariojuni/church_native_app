import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useMemberStore } from '../store/useMemberStore';
import '../global.css';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({});

  const { initialized, currentUser, initializeAuthListener } = useAuthStore();
  const { initializeMembersListener, initializeServicesListener } = useMemberStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initializeAuthListener();
    initializeMembersListener();
    initializeServicesListener();

    // On fresh install, trigger background download of default Bible (NASB2020: 2692)
    const initOfflineBible = async () => {
      try {
        const { isBibleOffline } = await import('../utils/offlineDb');
        const offline = await isBibleOffline('2692');
        if (!offline) {
          console.log('Initiating background download of default Bible (2692)...');
          const { downloadBibleOffline } = await import('../utils/bibleApi');
          downloadBibleOffline('2692');
        }
      } catch (e) {
        console.error('Failed to init offline bible sync:', e);
      }
    };
    initOfflineBible();
  }, []);

  useEffect(() => {
    if (loaded && initialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, initialized]);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!currentUser && !inAuthGroup) {
      // Redirect to login
      router.replace('/(auth)/login');
    } else if (currentUser && inAuthGroup) {
      // Redirect to main app
      router.replace('/(tabs)');
    }
  }, [currentUser, initialized, segments]);

  if (!loaded || !initialized) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="scanner" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="my-qr" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="more" options={{ headerShown: false }} />
        <Stack.Screen name="giving" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
