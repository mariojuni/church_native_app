import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { Check, Trash2, Plus, Settings, CloudDownload, ChevronLeft, ChevronRight, Search, Globe, CheckCircle, X } from 'lucide-react-native';
import { removeVersion, fetchOrganization, fetchBiblesByLanguage, downloadBibleOffline, saveVersion, getUserPreferences, saveUserPreferences, getSavedVersions } from '../utils/bibleApi';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  { id: 'ind', tag: 'ind', name: 'Bahasa Indonesia', local_name: 'Bahasa Indonesia', biblesCount: 4 }
];

type Screen = 'MyVersions' | 'DiscoverVersions' | 'LanguageSelect' | 'VersionDetail';

export default function VersionManagerScreen() {
  const router = useRouter();

  const [savedVersions, setSavedVersions] = useState<any[]>([]);
  const [activeTranslation, setActiveTranslation] = useState<string | number>('');

  const [stack, setStack] = useState<Screen[]>(['MyVersions']);
  const currentScreen = stack[stack.length - 1];

  const animateLayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const push = (screen: Screen) => {
    animateLayout();
    setStack(prev => [...prev, screen]);
  };
  
  const pop = () => {
    animateLayout();
    setStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };

  const [isEditMode, setIsEditMode] = useState(false);
  const [publishers, setPublishers] = useState<Record<string, string>>({});

  const [selectedLanguage, setSelectedLanguage] = useState(POPULAR_LANGUAGES[0]);
  const [bibles, setBibles] = useState<any[]>([]);
  const [biblesLoading, setBiblesLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);

  const [search, setSearch] = useState('');
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState<any[]>(POPULAR_LANGUAGES);

  const [selectedBibleDetail, setSelectedBibleDetail] = useState<any>(null);

  const refreshSavedVersions = async () => {
    const versions = await getSavedVersions();
    setSavedVersions(versions);
  };

  useEffect(() => {
    const init = async () => {
      const prefs = await getUserPreferences();
      setActiveTranslation(prefs?.activeTranslation || '');
      await refreshSavedVersions();
    };
    init();
  }, []);

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

    fetchPublishers();
  }, [savedVersions]);

  useEffect(() => {
    if (selectedLanguage) {
      const loadBibles = async () => {
        setBiblesLoading(true);
        const fetchedBibles = await fetchBiblesByLanguage(selectedLanguage.tag);
        animateLayout();
        setBibles(fetchedBibles);
        setBiblesLoading(false);
      };
      loadBibles();
    }
  }, [selectedLanguage]);

  const handleSelectVersion = async (id: string | number) => {
    const prefs = await getUserPreferences();
    await saveUserPreferences({ ...prefs, activeTranslation: id });
    setActiveTranslation(id);
    router.back();
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    animateLayout();
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
            animateLayout();
            await removeVersion(id);
            await refreshSavedVersions();
            if (String(activeTranslation) === String(id) && savedVersions.length > 1) {
               const remaining = savedVersions.filter(v => String(v.id) !== String(id));
               handleSelectVersion(remaining[0].id);
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
      await refreshSavedVersions();
      Alert.alert("Success", "Bible downloaded successfully!");
      if (currentScreen === 'VersionDetail') pop();
    } else {
      Alert.alert("Error", "Failed to start download. Please try again.");
    }
    setDownloadingId(null);
  };

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
                style={[styles.card, isActive ? styles.cardActive : styles.cardInactive]}
                onPress={() => !isEditMode && handleSelectVersion(version.id)}
                disabled={isEditMode}
                activeOpacity={0.7}
              >
                {isEditMode && (
                  <TouchableOpacity onPress={() => handleRemove(version.id)} style={styles.deleteIcon}>
                    <Trash2 size={14} color="#fff" />
                  </TouchableOpacity>
                )}
                
                {!isEditMode && (
                  <View style={[styles.abbrBox, isActive && styles.abbrBoxActive]}>
                    <Text style={[styles.abbrText, isActive && styles.textActive]}>{abbr}</Text>
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

  const renderDiscoverVersions = () => {
    const downloadedIds = savedVersions.map(v => String(v.id));
    let displayBibles = bibles.filter(b => !downloadedIds.includes(String(b.id)));
    
    if (discoverSearch) {
      const lower = discoverSearch.toLowerCase();
      displayBibles = displayBibles.filter(b => 
        (b.title || b.localized_title || '').toLowerCase().includes(lower) ||
        (b.abbreviation || b.localized_abbreviation || '').toLowerCase().includes(lower)
      );
    }

    return (
      <View style={{ flexShrink: 1 }}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Versions"
            value={discoverSearch}
            onChangeText={setDiscoverSearch}
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity onPress={() => push('LanguageSelect')} style={styles.inlineLanguageRow} activeOpacity={0.7}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Globe size={18} color="#1a1a1a" />
            <Text style={styles.inlineLanguageText}>{selectedLanguage.name}</Text>
            {selectedLanguage.biblesCount && (
              <View style={styles.inlineLanguageCount}>
                <Text style={styles.inlineLanguageCountText}>{selectedLanguage.biblesCount}</Text>
              </View>
            )}
          </View>
          <ChevronRight size={18} color="#999" />
        </TouchableOpacity>

        {biblesLoading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color="#FF6596" />
          </View>
        ) : (
          <ScrollView style={styles.content}>
            <View style={styles.discoverListContainer}>
              {displayBibles.length === 0 ? (
                <Text style={styles.emptyText}>No versions found.</Text>
              ) : (
                displayBibles.map(bible => {
                  const isDownloading = String(downloadingId) === String(bible.id);
                  const abbr = String(bible.abbreviation || bible.localized_abbreviation || bible.id || '').replace(/(\d{2,})$/, '\n$1');
                  
                  return (
                    <TouchableOpacity
                      key={bible.id}
                      style={[styles.discoverListItem, isDownloading && { opacity: 0.6 }]}
                      onPress={() => {
                        setSelectedBibleDetail(bible);
                        push('VersionDetail');
                      }}
                      disabled={isDownloading}
                      activeOpacity={0.7}
                    >
                      <View style={styles.discoverAbbrBox}>
                        <Text style={styles.discoverAbbrText}>{abbr}</Text>
                      </View>
    
                      <View style={styles.versionInfo}>
                        <Text style={styles.versionName}>
                          {bible.title || bible.localized_title}
                        </Text>
                      </View>
                      
                      <View style={{ marginLeft: 12 }}>
                        {isDownloading ? (
                          <ActivityIndicator size="small" color="#FF6596" />
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
  };

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
          autoCapitalize="none"
        />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.languageListContainer}>
          {filteredLanguages.map(lang => {
            const isSelected = selectedLanguage.id === lang.id;
            return (
              <TouchableOpacity 
                key={lang.id} 
                style={[styles.langItem, isSelected && styles.langItemActive]} 
                onPress={() => handleSelectLanguage(lang)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={[styles.langName, isSelected && styles.textActive]}>{lang.name}</Text>
                  {lang.local_name && lang.local_name !== lang.name && (
                    <Text style={styles.langLocalName}>{lang.local_name}</Text>
                  )}
                </View>
                {isSelected ? (
                  <Check size={20} color="#FF6596" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 13, color: '#999' }}>{lang.biblesCount || '?'} versions</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
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
      <View style={{ flexShrink: 1, justifyContent: 'space-between' }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <View style={styles.detailHeader}>
            <View style={styles.heroAbbrBox}>
              <Text style={styles.heroAbbrText}>{abbr}</Text>
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

        <View style={styles.stickyFooter}>
          <TouchableOpacity 
            style={[styles.downloadBtn, (isDownloaded || isDownloading) && styles.downloadBtnDisabled]}
            onPress={() => handleDownload(bible)}
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
            <Text style={styles.downloadBtnText}>
              {isDownloading ? 'Downloading...' : isDownloaded ? 'Downloaded' : 'Download Version'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  let headerTitle = "My Versions";
  let headerLeft = null;
  let headerRight = null;

  if (currentScreen === 'MyVersions') {
    headerTitle = "My Versions";
    headerLeft = (
      <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
        <X size={24} color="#1a1a1a" />
      </TouchableOpacity>
    );
    headerRight = (
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={() => { animateLayout(); setIsEditMode(!isEditMode); }} style={styles.headerBtn}>
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
      <TouchableOpacity onPress={pop} style={{ padding: 8 }}>
        <ChevronLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>
    );
    headerRight = null;
  } else if (currentScreen === 'LanguageSelect') {
    headerTitle = "Languages";
    headerLeft = (
      <TouchableOpacity onPress={pop} style={{ padding: 8 }}>
        <ChevronLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>
    );
  } else if (currentScreen === 'VersionDetail') {
    headerTitle = "Version Info";
    headerLeft = (
      <TouchableOpacity onPress={pop} style={{ padding: 8 }}>
        <ChevronLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.modalHeader}>
        <View style={styles.headerLeftContainer}>
          {headerLeft}
        </View>
        <Text style={styles.modalTitle}>{headerTitle}</Text>
        <View style={styles.headerRightContainer}>
          {headerRight}
        </View>
      </View>
      {currentScreen === 'MyVersions' && renderMyVersions()}
      {currentScreen === 'DiscoverVersions' && renderDiscoverVersions()}
      {currentScreen === 'LanguageSelect' && renderLanguageSelect()}
      {currentScreen === 'VersionDetail' && renderVersionDetail()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeftContainer: {
    minWidth: 60,
    alignItems: 'flex-start'
  },
  headerRightContainer: {
    minWidth: 60,
    alignItems: 'flex-end'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center'
  },
  content: { flexShrink: 1, backgroundColor: '#fff' },
  listContainer: { padding: 16, gap: 12 },
  loadingWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
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
    padding: 16,
    borderRadius: 16,
    marginBottom: 0,
  },
  cardInactive: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardActive: {
    backgroundColor: '#fff',
    borderColor: '#FF6596',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  abbrBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    padding: 4,
  },
  abbrBoxActive: {
    backgroundColor: 'rgba(255, 101, 150, 0.1)',
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
    marginBottom: 4,
  },
  versionName: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#1a1a1a',
    lineHeight: 20,
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
    backgroundColor: '#f5f5f5',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1a1a1a' },
  languageListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  langItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 8,
  },
  langItemActive: {
    backgroundColor: 'rgba(255,101,150,0.05)',
  },
  langName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  langLocalName: { fontSize: 13, color: '#666', marginTop: 2 },
  inlineLanguageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  inlineLanguageText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  inlineLanguageCount: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inlineLanguageCountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
  },
  discoverListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  discoverListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  discoverAbbrBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  discoverAbbrText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  detailHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 32,
  },
  heroAbbrBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 101, 150, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroAbbrText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6596',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailPublisher: {
    fontSize: 14,
    color: '#FF6596',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailSection: {
    marginBottom: 32,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  detailBody: {
    fontSize: 16,
    lineHeight: 26,
    color: '#444',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  downloadBtn: {
    flexDirection: 'row',
    backgroundColor: '#FF6596',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6596',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  downloadBtnDisabled: {
    backgroundColor: 'rgba(255, 101, 150, 0.5)',
    shadowOpacity: 0,
    elevation: 0,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
