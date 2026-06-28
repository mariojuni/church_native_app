import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Check, Trash2, Plus, Settings, CloudDownload, ChevronLeft, ChevronRight, Search, Globe, CheckCircle, Info } from 'lucide-react-native';
import { removeVersion, fetchOrganization, fetchBiblesByLanguage, downloadBibleOffline, saveVersion } from '../../utils/bibleApi';
import AppModal from '../ui/AppModal';

const POPULAR_LANGUAGES = [
  { id: 'eng', tag: 'eng', name: 'English', local_name: 'English', biblesCount: 12 },
  { id: 'Fil', tag: 'Fil', name: 'Filipino / Tagalog', local_name: 'Filipino', biblesCount: 4 },
  { id: 'spa', tag: 'spa', name: 'Spanish', local_name: 'Español', biblesCount: 8 },
  { id: 'fra', tag: 'fra', name: 'French', local_name: 'Français', biblesCount: 6 },
  { id: 'deu', tag: 'deu', name: 'German', local_name: 'Deutsch', biblesCount: 5 },
  { id: 'zho', tag: 'zho', name: 'Chinese', local_name: '中文', biblesCount: 7 },
  { id: 'jpn', tag: 'jpn', name: 'Japanese', local_name: '日本語', biblesCount: 3 },
  { id: 'kor', tag: 'kor', name: 'Korean', local_name: '한국어', biblesCount: 3 },
  { id: 'rus', tag: 'rus', name: 'Russian', local_name: 'Русский', biblesCount: 4 },
  { id: 'por', tag: 'por', name: 'Portuguese', local_name: 'Português', biblesCount: 5 },
  { id: 'ind', tag: 'ind', name: 'Indonesian', local_name: 'Bahasa Indonesia', biblesCount: 4 }
];

type Screen = 'MyVersions' | 'DiscoverVersions' | 'LanguageSelect' | 'VersionDetail';

interface VersionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  savedVersions: any[];
  activeTranslation: string | number;
  refreshSavedVersions: () => void;
  onSelectVersion: (id: string | number) => void;
}

export default function VersionManager({
  isOpen,
  onClose,
  savedVersions,
  activeTranslation,
  refreshSavedVersions,
  onSelectVersion
}: VersionManagerProps) {
  const [stack, setStack] = useState<Screen[]>(['MyVersions']);
  const currentScreen = stack[stack.length - 1];

  const push = (screen: Screen) => setStack(prev => [...prev, screen]);
  const pop = () => setStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

  const [isEditMode, setIsEditMode] = useState(false);
  const [publishers, setPublishers] = useState<Record<string, string>>({});

  const [selectedLanguage, setSelectedLanguage] = useState(POPULAR_LANGUAGES[0]);
  const [bibles, setBibles] = useState<any[]>([]);
  const [biblesLoading, setBiblesLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);

  const [search, setSearch] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState<any[]>(POPULAR_LANGUAGES);

  const [selectedBibleDetail, setSelectedBibleDetail] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setStack(['MyVersions']);
      setIsEditMode(false);
      setSearch('');
      setSelectedBibleDetail(null);
      setFilteredLanguages(POPULAR_LANGUAGES);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchPublishers = async () => {
      const newPublishers = { ...publishers };
      const missingOrgs = savedVersions
        .map(v => v.organization_id)
        .filter(id => id && !newPublishers[id]);
      
      const uniqueOrgs = [...new Set(missingOrgs)];

      await Promise.all(uniqueOrgs.map(async (orgId) => {
        const data = await fetchOrganization(orgId);
        newPublishers[orgId] = data ? data.name : 'Public Domain';
      }));
      setPublishers(newPublishers);
    };

    if (isOpen) {
      fetchPublishers();
    }
  }, [isOpen, savedVersions]);

  useEffect(() => {
    if (selectedLanguage) {
      const loadBibles = async () => {
        setBiblesLoading(true);
        const fetchedBibles = await fetchBiblesByLanguage(selectedLanguage.tag);
        setBibles(fetchedBibles);
        setBiblesLoading(false);
      };
      loadBibles();
    }
  }, [selectedLanguage]);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text) {
      setFilteredLanguages(POPULAR_LANGUAGES);
      return;
    }
    const lower = text.toLowerCase();
    setFilteredLanguages(POPULAR_LANGUAGES.filter(l => 
      l.name.toLowerCase().includes(lower) || 
      (l.local_name && l.local_name.toLowerCase().includes(lower))
    ));
  };

  const handleSelectLanguage = (lang: any) => {
    setSelectedLanguage(lang);
    pop();
  };

  const handleRemove = async (id: string | number) => {
    Alert.alert(
      "Remove Version",
      "Are you sure you want to remove this downloaded version?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            await removeVersion(id);
            refreshSavedVersions();
            if (String(activeTranslation) === String(id) && savedVersions.length > 1) {
               const remaining = savedVersions.filter(v => String(v.id) !== String(id));
               onSelectVersion(remaining[0].id);
            }
          }
        }
      ]
    );
  };

  const handleDownload = async (bible: any) => {
    const isDownloaded = savedVersions.map(v => String(v.id)).includes(String(bible.id));
    if (isDownloaded) return;

    setDownloadingId(bible.id);
    const success = await downloadBibleOffline(bible.id);
    if (success) {
      await saveVersion(bible);
      refreshSavedVersions();
      Alert.alert("Success", "Bible downloaded successfully!");
      if (currentScreen === 'VersionDetail') pop();
    } else {
      Alert.alert("Error", "Failed to start download. Please try again.");
    }
    setDownloadingId(null);
  };

  // ---------------- RENDERS ----------------

  const renderMyVersions = () => (
    <ScrollView style={styles.content}>
      <View style={styles.listContainer}>
        {savedVersions.length === 0 ? (
          <Text style={styles.emptyText}>No versions saved yet. Click the + icon to discover translations.</Text>
        ) : (
          savedVersions.map((version) => {
            const isActive = String(version.id) === String(activeTranslation);
            const abbr = String(version.local_abbreviation || version.abbreviation || version.id || '').replace(/(\d{2,})$/, '\n$1');
            
            return (
              <TouchableOpacity
                key={version.id}
                style={[styles.card, isActive && styles.cardActive]}
                onPress={() => !isEditMode && onSelectVersion(version.id)}
                disabled={isEditMode}
              >
                {isEditMode && (
                  <TouchableOpacity onPress={() => handleRemove(version.id)} style={styles.deleteIcon}>
                    <Trash2 size={14} color="#fff" />
                  </TouchableOpacity>
                )}
                
                {!isEditMode && (
                  <View style={styles.abbrBox}>
                    <Text style={styles.abbrText}>{abbr}</Text>
                  </View>
                )}

                <View style={styles.versionInfo}>
                  <Text style={styles.publisherText}>
                    {publishers[version.organization_id] || (version.organization_id ? 'Loading...' : 'Public Domain')}
                  </Text>
                  <Text style={[styles.versionName, isActive && styles.textActive]}>
                    {version.title || version.local_title}
                  </Text>
                </View>
                
                {!isEditMode && isActive && (
                  <Check size={20} color="#FF6596" style={{ marginLeft: 16 }} />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );

  const renderDiscoverVersions = () => (
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
                const isDownloaded = savedVersions.map(v => String(v.id)).includes(String(bible.id));
                const isDownloading = String(downloadingId) === String(bible.id);
                const abbr = String(bible.abbreviation || bible.localized_abbreviation || bible.id || '').replace(/(\d{2,})$/, '\n$1');
                
                return (
                  <TouchableOpacity
                    key={bible.id}
                    style={[styles.card, isDownloading && { opacity: 0.6 }]}
                    onPress={() => {
                      setSelectedBibleDetail(bible);
                      push('VersionDetail');
                    }}
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
                        <ChevronRight size={20} color="#ccc" />
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

  const renderLanguageSelect = () => (
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
              {selectedLanguage.id === lang.id ? (
                <Check size={20} color="#FF6596" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 13, color: '#999' }}>{lang.biblesCount || '?'} versions</Text>
                  <ChevronRight size={20} color="#ccc" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderVersionDetail = () => {
    if (!selectedBibleDetail) return null;
    const bible = selectedBibleDetail;
    const isDownloaded = savedVersions.map(v => String(v.id)).includes(String(bible.id));
    const isDownloading = String(downloadingId) === String(bible.id);
    const abbr = String(bible.abbreviation || bible.localized_abbreviation || bible.id || '');

    return (
      <View style={{ flexShrink: 1, padding: 24, justifyContent: 'space-between' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.detailHeader}>
            <View style={[styles.abbrBox, { width: 72, height: 72, borderRadius: 16, marginBottom: 16 }]}>
              <Text style={[styles.abbrText, { fontSize: 18 }]}>{abbr}</Text>
            </View>
            <Text style={styles.detailTitle}>{bible.title || bible.localized_title}</Text>
            <Text style={styles.detailPublisher}>
              {bible.publisher_url ? 'Official Publisher Version' : 'Public Domain'}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Description</Text>
            <Text style={styles.detailBody}>
              {bible.description || bible.localized_description || 'No description available for this version.'}
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={[styles.downloadBtn, (isDownloaded || isDownloading) && styles.downloadBtnDisabled]}
          onPress={() => handleDownload(bible)}
          disabled={isDownloaded || isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator color="#1a1a1a" style={{ marginRight: 8 }} />
          ) : isDownloaded ? (
            <CheckCircle size={20} color="#999" style={{ marginRight: 8 }} />
          ) : (
            <CloudDownload size={20} color="#fff" style={{ marginRight: 8 }} />
          )}
          <Text style={[styles.downloadBtnText, (isDownloaded || isDownloading) && { color: '#1a1a1a' }]}>
            {isDownloading ? 'Downloading...' : isDownloaded ? 'Downloaded' : 'Download Version'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ---------------- HEADERS ----------------

  let headerTitle = "My Versions";
  let headerLeft = null;
  let headerRight = null;

  if (currentScreen === 'MyVersions') {
    headerTitle = "My Versions";
    headerRight = (
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)} style={styles.headerBtn}>
          <Settings size={20} color={isEditMode ? "#FF6596" : "#1a1a1a"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => push('DiscoverVersions')} style={styles.headerBtn}>
          <Plus size={20} color="#1a1a1a" />
        </TouchableOpacity>
      </View>
    );
  } else if (currentScreen === 'DiscoverVersions') {
    headerTitle = "Discover Versions";
    headerLeft = (
      <TouchableOpacity onPress={pop} style={{ padding: 8, marginLeft: -8 }}>
        <ChevronLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>
    );
    headerRight = (
      <TouchableOpacity onPress={() => push('LanguageSelect')} style={styles.languagePill}>
        <Globe size={16} color="#FF6596" />
        <Text style={styles.languagePillText}>{selectedLanguage.name}</Text>
      </TouchableOpacity>
    );
  } else if (currentScreen === 'LanguageSelect') {
    headerTitle = "Languages";
    headerLeft = (
      <TouchableOpacity onPress={pop} style={{ padding: 8, marginLeft: -8 }}>
        <ChevronLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>
    );
  } else if (currentScreen === 'VersionDetail') {
    headerTitle = "Version Info";
    headerLeft = (
      <TouchableOpacity onPress={pop} style={{ padding: 8, marginLeft: -8 }}>
        <ChevronLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>
    );
  }

  return (
    <AppModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={headerTitle} 
      headerTitleAlign="left"
      headerLeft={headerLeft}
      headerRight={headerRight}
    >
      {currentScreen === 'MyVersions' && renderMyVersions()}
      {currentScreen === 'DiscoverVersions' && renderDiscoverVersions()}
      {currentScreen === 'LanguageSelect' && renderLanguageSelect()}
      {currentScreen === 'VersionDetail' && renderVersionDetail()}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  content: { flexShrink: 1, backgroundColor: '#fff' },
  listContainer: { padding: 16, gap: 12 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 40 },
  headerBtn: { padding: 8, marginLeft: 8 },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,101,150,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6
  },
  languagePillText: {
    color: '#FF6596',
    fontWeight: '600',
    fontSize: 13
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 0,
  },
  cardActive: {
    borderColor: '#FF6596',
    borderWidth: 2,
  },
  abbrBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
    marginBottom: 2,
  },
  versionName: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#1a1a1a',
    lineHeight: 18,
  },
  textActive: { color: '#FF6596' },
  deleteIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  downloadingText: {
    color: '#FF6596',
    fontSize: 12,
    fontWeight: '600',
  },
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  langName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  langLocalName: { fontSize: 13, color: '#666', marginTop: 2 },
  detailHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailPublisher: {
    fontSize: 14,
    color: '#FF6596',
    fontWeight: '500',
  },
  detailSection: {
    marginBottom: 32,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  detailBody: {
    fontSize: 15,
    lineHeight: 24,
    color: '#444',
  },
  downloadBtn: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  downloadBtnDisabled: {
    backgroundColor: '#f0f0f0',
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
