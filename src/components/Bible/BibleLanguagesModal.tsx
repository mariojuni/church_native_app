import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Search, ChevronRight, Download, CheckCircle, CloudDownload } from 'lucide-react-native';
import { fetchLanguages, fetchBiblesByLanguage, downloadBibleOffline, saveVersion } from '../../utils/bibleApi';
import AppModal from '../ui/AppModal';

const POPULAR_LANGUAGES = [
  { id: 'eng', tag: 'eng', name: 'English', local_name: 'English' },
  { id: 'Fil', tag: 'Fil', name: 'Filipino / Tagalog', local_name: 'Filipino' },
  { id: 'spa', tag: 'spa', name: 'Spanish', local_name: 'Español' },
  { id: 'fra', tag: 'fra', name: 'French', local_name: 'Français' },
  { id: 'deu', tag: 'deu', name: 'German', local_name: 'Deutsch' },
  { id: 'zho', tag: 'zho', name: 'Chinese', local_name: '中文' },
  { id: 'jpn', tag: 'jpn', name: 'Japanese', local_name: '日本語' },
  { id: 'kor', tag: 'kor', name: 'Korean', local_name: '한국어' },
  { id: 'rus', tag: 'rus', name: 'Russian', local_name: 'Русский' },
  { id: 'por', tag: 'por', name: 'Portuguese', local_name: 'Português' },
  { id: 'ind', tag: 'ind', name: 'Indonesian', local_name: 'Bahasa Indonesia' }
];

interface BibleLanguagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedVersionIds: (string | number)[];
  onVersionAdded: (translation: any) => void;
}

export default function BibleLanguagesModal({ isOpen, onClose, savedVersionIds, onVersionAdded }: BibleLanguagesModalProps) {
  const [languages, setLanguages] = useState<any[]>(POPULAR_LANGUAGES);
  const [filteredLanguages, setFilteredLanguages] = useState<any[]>(POPULAR_LANGUAGES);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<any>(null);
  const [bibles, setBibles] = useState<any[]>([]);
  const [biblesLoading, setBiblesLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLanguages(POPULAR_LANGUAGES);
      setFilteredLanguages(POPULAR_LANGUAGES);
      setSelectedLanguage(null);
      setBibles([]);
      setDownloadingId(null);
      setSearch('');
    }
  }, [isOpen]);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text) {
      setFilteredLanguages(languages);
      return;
    }
    const lower = text.toLowerCase();
    setFilteredLanguages(languages.filter(l => 
      l.name.toLowerCase().includes(lower) || 
      (l.local_name && l.local_name.toLowerCase().includes(lower))
    ));
  };

  const handleSelectLanguage = async (lang: any) => {
    setSelectedLanguage(lang);
    setBiblesLoading(true);
    const fetchedBibles = await fetchBiblesByLanguage(lang.tag);
    setBibles(fetchedBibles);
    setBiblesLoading(false);
  };

  const handleDownload = async (bible: any) => {
    if (savedVersionIds.map(String).includes(String(bible.id))) {
      onVersionAdded(bible);
      return;
    }
    setDownloadingId(bible.id);
    const success = await downloadBibleOffline(bible.id);
    if (success) {
      await saveVersion(bible);
      onVersionAdded(bible);
    } else {
      Alert.alert("Error", "Failed to start download. Please try again.");
    }
    setDownloadingId(null);
  };

  const renderLanguages = () => (
    <View style={{ flexShrink: 1 }}>
      <View style={styles.searchContainer}>
        <Search size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search languages..."
          value={search}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6596" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.listContainer}>
            {filteredLanguages.map(lang => (
              <TouchableOpacity key={lang.id} style={styles.langItem} onPress={() => handleSelectLanguage(lang)}>
                <View>
                  <Text style={styles.langName}>{lang.name}</Text>
                  {lang.local_name && lang.local_name !== lang.name && (
                    <Text style={styles.langLocalName}>{lang.local_name}</Text>
                  )}
                </View>
                <ChevronRight size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderBibles = () => (
    <View style={{ flexShrink: 1 }}>
      {biblesLoading ? (
        <ActivityIndicator size="large" color="#FF6596" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.listContainer}>
            {bibles.length === 0 ? (
              <Text style={styles.emptyText}>No Bibles found for this language.</Text>
            ) : (
              bibles.map(bible => {
                const isDownloaded = savedVersionIds.map(String).includes(String(bible.id));
                const isDownloading = String(downloadingId) === String(bible.id);
                const abbr = String(bible.abbreviation || bible.localized_abbreviation || bible.id || '').replace(/(\d{2,})$/, '\n$1');
                
                return (
                  <TouchableOpacity
                    key={bible.id}
                    style={[styles.card, isDownloading && { opacity: 0.6 }]}
                    onPress={() => handleDownload(bible)}
                    disabled={isDownloading}
                  >
                    <View style={styles.abbrBox}>
                      <Text style={styles.abbrText}>{abbr}</Text>
                    </View>
  
                    <View style={styles.versionInfo}>
                      <Text style={styles.versionName}>
                        {bible.title || bible.localized_title}
                      </Text>
                      {bible.publisher_url && (
                        <Text style={styles.publisherText}>Official Publisher Version</Text>
                      )}
                    </View>
                    
                    <View style={{ marginLeft: 12 }}>
                      {isDownloading ? (
                        <Text style={styles.downloadingText}>Loading...</Text>
                      ) : isDownloaded ? (
                        <CheckCircle size={20} color="#34C759" />
                      ) : (
                        <CloudDownload size={20} color="#FF6596" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const headerLeft = selectedLanguage ? (
    <TouchableOpacity onPress={() => setSelectedLanguage(null)} style={{ padding: 8, marginLeft: -8 }}>
      <ChevronRight size={24} color="#1a1a1a" style={{ transform: [{ rotate: '180deg' }] }} />
    </TouchableOpacity>
  ) : null;

  const modalTitle = selectedLanguage 
    ? `Bibles in ${selectedLanguage.name}`
    : "Discover Versions";

  return (
    <AppModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={modalTitle}
      headerTitleAlign="left"
      headerLeft={headerLeft}
    >
      {selectedLanguage ? renderBibles() : renderLanguages()}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  content: { flexShrink: 1, backgroundColor: '#f9f9f9' },
  listContainer: { padding: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#1a1a1a' },
  langItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  langName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  langLocalName: { fontSize: 13, color: '#666', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  abbrBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    padding: 4,
  },
  abbrText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  versionInfo: { flex: 1 },
  publisherText: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  versionName: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#1a1a1a',
    lineHeight: 18,
  },
  downloadingText: {
    color: '#FF6596',
    fontSize: 12,
    fontWeight: '600',
  }
});
