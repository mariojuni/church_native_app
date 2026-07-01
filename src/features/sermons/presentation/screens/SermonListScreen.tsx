import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useSermonStore } from '@/store/useSermonStore';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompactSermonCard } from '../components/CompactSermonCard';
import { HeroSermonCard } from '../components/HeroSermonCard';
import { HorizontalSermonCard } from '../components/HorizontalSermonCard';
import { SearchBar } from '../components/SearchBar';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function SermonListScreen() {
  const router = useRouter();
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  const {
    sermons,
    loading,
    fetchSermons,
    searchSermons,
    setSearchQuery,
    searchQuery,
    toggleFavorite,
    favorites,
    loadFavorites
  } = useSermonStore();

  const currentUser = useAuthStore((state) => state.currentUser);

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  useEffect(() => {
    fetchSermons(true);
    if (currentUser) {
      loadFavorites(currentUser.uid);
    }
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      // searchSermons(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  const handleSearchChange = (text: string) => {
    setLocalSearchQuery(text);
  };

  const handleSearchClear = () => {
    setLocalSearchQuery('');
    setSearchQuery('');
    fetchSermons(true);
  };

  const handleFavorite = async (sermonId: string) => {
    if (currentUser) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await toggleFavorite(currentUser.uid, sermonId);
    }
  };

  const handleSermonPress = (sermonId: string) => {
    router.push({
      pathname: '/sermon-detail',
      params: { id: sermonId }
    });
  };

  const heroSermon = sermons.length > 0 ? sermons[0] : null;
  const recentSermons = sermons.length > 1 ? sermons.slice(1, 6) : [];
  const mostPlayedSermons = useMemo(() => {
    if (sermons.length <= 1) return [];
    return [...sermons.slice(1)].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5);
  }, [sermons]);

  const isSearching = localSearchQuery.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: Math.max(insets.top, 16) }} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={localSearchQuery}
          onChangeText={handleSearchChange}
          onClear={handleSearchClear}
        />
      </View>

      <FlatList
        data={isSearching ? sermons : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CompactSermonCard
            sermon={item}
            onPress={() => handleSermonPress(item.id)}
          />
        )}
        contentContainerStyle={!isSearching ? { paddingBottom: BottomTabInset + 40 } : [styles.list, { paddingBottom: BottomTabInset + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          !isSearching ? (
            <RefreshControl
              refreshing={loading}
              onRefresh={() => fetchSermons(true)}
              tintColor="#FF6596"
              colors={['#FF6596']}
            />
          ) : undefined
        }
        ListEmptyComponent={
          loading && sermons.length === 0 ? (
            <View style={[styles.centerContainer, { backgroundColor: colors.background, marginTop: 40 }]}>
              <ActivityIndicator size="large" color="#FF6596" />
            </View>
          ) : isSearching ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                We could not find any sermons matching &quot;{localSearchQuery}&quot;.
              </Text>
            </View>
          ) : (
            <View style={styles.tabContent}>
              {heroSermon ? (
                <View style={styles.heroSection}>
                  <HeroSermonCard
                    sermon={heroSermon}
                    onPress={() => handleSermonPress(heroSermon.id)}
                    isNew={true}
                  />
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Sermons Yet</Text>
                </View>
              )}

              {recentSermons.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Recently Uploaded</Text>
                  <FlatList
                    data={recentSermons}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalListContent}
                    renderItem={({ item }) => (
                      <HorizontalSermonCard
                        sermon={item}
                        onPress={() => handleSermonPress(item.id)}
                      />
                    )}
                  />
                </View>
              )}

              {mostPlayedSermons.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Most Played</Text>
                  <FlatList
                    data={mostPlayedSermons}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalListContent}
                    renderItem={({ item }) => (
                      <HorizontalSermonCard
                        sermon={item}
                        onPress={() => handleSermonPress(item.id)}
                      />
                    )}
                  />
                </View>
              )}
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  list: {
    paddingVertical: Spacing.two,
  },
  tabContent: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  section: {
    marginTop: Spacing.four,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  horizontalListContent: {
    paddingHorizontal: Spacing.four,
  },
  emptyContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
