
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VersionProvider } from './_context';

export default function VersionManagerLayout() {
  return (
    <VersionProvider>
      <SafeAreaView style={styles.container}>
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={styles.dragHandle} />
        </View>
        <View style={{ flex: 1, overflow: 'hidden' }}>
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
        </View>
      </SafeAreaView>
    </VersionProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#e0e0e0',
    marginBottom: 4,
  },
});
