import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { CustomTabBar } from '@/features/navigation/presentation/components/CustomTabBar';
import { getTabScreens } from '@/features/navigation/presentation/tabNavigation';
import { useAuthStore } from '../../store/useAuthStore';
import { AudioProvider, useAudio } from '@/features/sermons/presentation/context/AudioContext';
import { MiniAudioPlayer } from '@/features/sermons/presentation/components/MiniAudioPlayer';
import { useSermonStore } from '@/store/useSermonStore';

function TabsContent() {
  const userProfile = useAuthStore((state) => state.userProfile);
  const isStaff = userProfile?.role?.toLowerCase() === 'staff';
  const tabScreens = getTabScreens(isStaff);
  
  const { currentSermon, isPlaying } = useSermonStore();
  const audio = useAudio();
  
  const showMiniPlayer = currentSermon?.type === 'audio' && currentSermon !== null;

  const handlePlayPause = async () => {
    if (isPlaying) {
      await audio.pauseAudio();
    } else {
      await audio.resumeAudio();
    }
  };

  const handleClose = async () => {
    await audio.stopAudio();
    useSermonStore.getState().clearCurrentSermon();
  };

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
      
      {showMiniPlayer && (
        <MiniAudioPlayer 
          onPlayPause={handlePlayPause}
          onClose={handleClose}
        />
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <AudioProvider>
      <TabsContent />
    </AudioProvider>
  );
}
