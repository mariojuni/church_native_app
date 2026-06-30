import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, ActivityIndicator } from 'react-native';
import { useSermonStore } from '@/store/useSermonStore';
import { useAuthStore } from '@/store/useAuthStore';
import { SermonCard } from '../components/SermonCard';
import { SearchBar } from '../components/SearchBar';
import { FilterChips } from '../components/FilterChips';
import { SortDropdown } from '../components/SortDropdown';
import { useTheme } from '@/hooks/use-theme';
import { Colors, Spacing, BottomTabInset } from '@/constants/theme';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { SermonFilter, SermonSort } from '../../domain/sermon.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    hasMore, 
    fetchSermons,
    searchSermons,
    setSearchQuery,
    searchQuery,
    filters,
    setFilters,
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
      searchSermons(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  const handleLoadMore = () => {
    if (!loading && hasMore && !localSearchQuery.trim()) {
      fetchSermons();
    }
  };


  const handleSearchChange = (text: string) => {
    setLocalSearchQuery(text);
  };

  const handleSearchClear = () => {
    setLocalSearchQuery('');
    setSearchQuery('');
    fetchSermons(true);
  };

  const handleFilterChange = (filter: SermonFilter) => {
    setFilters({ filter });
  };

  const handleSortChange = (sort: SermonSort) => {
    setFilters({ sort });
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

  const renderEmpty = () => {
    if (loading && sermons.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#FF6596" />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Loading sermons...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Sermons Yet</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Check back later for new sermons
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || sermons.length === 0) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#FF6596" />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { paddingTop: Math.max(insets.top, 24) }]}>
        <SearchBar
          value={localSearchQuery}
          onChangeText={handleSearchChange}
          onClear={handleSearchClear}
        />
      </View>

      {/* Filters and Sort */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersLeft}>
          <FilterChips
            activeFilter={filters.filter}
            onFilterChange={handleFilterChange}
          />
        </View>
        <SortDropdown
          activeSort={filters.sort}
          onSortChange={handleSortChange}
          iconOnly={true}
        />
      </View>

      <FlatList
        data={sermons}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SermonCard
            sermon={item}
            onPress={() => handleSermonPress(item.id)}
            onFavorite={() => handleFavorite(item.id)}
            isFavorited={favorites.has(item.id)}
          />
        )}
        contentContainerStyle={[
          styles.list,
          sermons.length === 0 && styles.emptyList,
          { paddingBottom: BottomTabInset + 80 }
        ]}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={loading && sermons.length === 0}
            onRefresh={() => {
              if (localSearchQuery.trim()) {
                searchSermons(localSearchQuery);
              } else {
                fetchSermons(true);
              }
            }}
            tintColor="#FF6596"
            colors={['#FF6596']}
          />
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  filtersLeft: {
    flex: 1,
  },
  list: {
    padding: Spacing.three,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  footer: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
