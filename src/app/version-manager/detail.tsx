
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ChevronLeft, CloudDownload, CheckCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVersionContext } from './_context';
import { styles } from './_styles';
import { downloadBibleOffline, saveVersion } from '../../utils/bibleApi';

export default function VersionDetailScreen() {
  const router = useRouter();
  const { bibleStr } = useLocalSearchParams();
  const bible = bibleStr ? JSON.parse(bibleStr as string) : null;
  const { savedVersions, refreshSavedVersions } = useVersionContext();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!bible) return null;

  const isDownloaded = savedVersions.map((v: any) => String(v.id)).includes(String(bible.id));
  const abbr = String(bible.abbreviation || bible.localized_abbreviation || bible.id || '');

  const handleDownload = async () => {
    if (isDownloaded) return;

    setIsDownloading(true);
    const success = await downloadBibleOffline(bible.id);
    if (success) {
      await saveVersion(bible);
      await refreshSavedVersions();
      Alert.alert("Success", "Bible downloaded successfully!");
      router.back();
    } else {
      Alert.alert("Error", "Failed to start download. Please try again.");
    }
    setIsDownloading(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <View style={styles.modalHeader}>
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <ChevronLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
        <Text style={styles.modalTitle}>Version Info</Text>
        <View style={styles.headerRightContainer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        <View style={{ alignItems: 'center', paddingVertical: 16, marginBottom: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(255, 101, 150, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FF6596' }}>{abbr}</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', marginBottom: 8 }}>{bible.title || bible.localized_title}</Text>
          <Text style={{ fontSize: 14, color: '#FF6596', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {bible.publisher_url ? 'Official Publisher Version' : 'Public Domain'}
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>Description</Text>
          <Text style={{ fontSize: 16, lineHeight: 26, color: '#444' }}>
            {bible.description || bible.localized_description || 'No description available for this version.'}
          </Text>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }}>
        <TouchableOpacity 
          style={[{ flexDirection: 'row', backgroundColor: '#FF6596', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#FF6596', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 }, (isDownloaded || isDownloading) && { backgroundColor: 'rgba(255, 101, 150, 0.5)', shadowOpacity: 0, elevation: 0 }]}
          onPress={handleDownload}
          disabled={isDownloaded || isDownloading}
          activeOpacity={0.8}
        >
          {isDownloading ? (
            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
          ) : isDownloaded ? (
            <CheckCircle size={20} color="#fff" style={{ marginRight: 8 }} />
          ) : (
            <CloudDownload size={20} color="#fff" style={{ marginRight: 8 }} />
          )}
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
            {isDownloading ? 'Downloading...' : isDownloaded ? 'Downloaded' : 'Download Version'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
