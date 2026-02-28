import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Search as SearchIcon, X } from 'lucide-react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { Colors } from '../theme';
import { api, searchApi } from '../services/api';

import NotFoundContentScreen from './NotFoundContentScreen';

type SearchResult = {
  id: string;
  title: string;
  artistName: string;
  artwork: string;
  type: 'ARTIST' | 'SONG';
  isLocked: boolean;
};

type SearchHistoryItem = {
  id: number;
  user_id: number;
  query: string;
  created_at: string;
};

type SearchListItem = SearchResult | SearchHistoryItem;

const RECENT_SEARCHES_STORAGE_KEY = 'recentSearches';

export default function SearchScreen({ navigation }: any) {
  const tabBarHeight = useBottomTabBarHeight();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [allContent, setAllContent] = useState<SearchResult[]>([]);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [artistsRes, contentRes] = await Promise.all([
          api.get('/artists'),
          api.get('/content'),
        ]);

        const artists = (artistsRes.data?.artists ?? []).map((a: any) => {
          const id = String(a.id);
          const title = (a.name ?? '').toString();
          const artistName = 'Artist';
          const artwork = (a.profileImageUrl ?? a.profile_image_url ?? '').toString();
          return {
            id,
            title,
            artistName,
            artwork,
            type: 'ARTIST' as const,
            isLocked: false,
          };
        });

        const content = (contentRes.data?.items ?? []).map((c: any) => {
          const id = String(c.id);
          const title = (c.title ?? '').toString();
          const artistName = (c.artistName ?? c.artist_name ?? '').toString();
          const artwork = (c.artwork ?? c.thumbnailUrl ?? c.thumbnail_url ?? '').toString();
          const isLocked = Boolean(c.locked ?? c.isLocked ?? false);
          return {
            id,
            title,
            artistName,
            artwork,
            type: 'SONG' as const,
            isLocked,
          };
        });

        const merged = [...artists, ...content].filter((x) => x.title.trim().length > 0);
        setAllContent(merged);
        setFilteredResults(merged);
      } catch {
        setAllContent([]);
        setFilteredResults([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const fallback = parsed
            .map((q: any, idx: number) => ({
              id: -(idx + 1),
              user_id: 0,
              query: (q ?? '').toString(),
              created_at: new Date().toISOString(),
            }))
            .filter((x) => x.query.trim().length > 0);
          setRecentSearches(fallback);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const persistHistoryFallback = useCallback(async (items: SearchHistoryItem[]) => {
    try {
      const queries = items
        .map((x) => x.query)
        .filter((q) => q.trim().length > 0)
        .slice(0, 10);
      await AsyncStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(queries));
    } catch {
      // ignore
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await searchApi.get('/history');
      const items = (res.data?.items ?? []) as SearchHistoryItem[];
      setRecentSearches(items);
      await persistHistoryFallback(items);
    } catch {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  }, [persistHistoryFallback]);

  useEffect(() => {
    if (!isSearchFocused) return;
    if (searchQuery.trim().length > 0) return;
    fetchHistory().catch(() => undefined);
  }, [fetchHistory, isSearchFocused, searchQuery]);

  const saveHistory = useCallback(
    async (query: string) => {
      const q = query.trim();
      if (!q) return;
      try {
        await searchApi.post('/history', { query: q });
        await fetchHistory();
      } catch {
        // ignore
      }
    },
    [fetchHistory]
  );

  const deleteHistoryItem = useCallback(
    async (id: number) => {
      if (id < 0) {
        const next = recentSearches.filter((x) => x.id !== id);
        setRecentSearches(next);
        await persistHistoryFallback(next);
        return;
      }
      try {
        await searchApi.delete(`/history/${id}`);
      } catch {
        // ignore
      }
      await fetchHistory();
    },
    [fetchHistory, persistHistoryFallback, recentSearches]
  );

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFilteredResults(allContent);
      return;
    }
    setFilteredResults(
      allContent.filter((item) => {
        const title = item.title.toLowerCase();
        const artist = item.artistName.toLowerCase();
        return title.includes(q) || artist.includes(q);
      })
    );
  }, [allContent, searchQuery]);

  const navigateHomeStack = (screen: string, params?: any) => {
    navigation.navigate('HomeTab', {
      screen: screen === 'Home' ? 'HomeIndex' : screen,
      params,
    });
  };

  const onPressResult = (item: SearchResult) => {
    saveHistory(item.title).catch(() => undefined);
    if (item.type === 'ARTIST') {
      navigateHomeStack('Artist', { artistId: item.id });
      return;
    }

    if (item.isLocked) {
      navigateHomeStack('ArtistSubscription', {
        song: {
          id: item.id,
          title: item.title,
          artist: item.artistName,
          duration: '3:12',
          thumbnail: item.artwork,
          locked: true,
        },
        coverImage: item.artwork,
      });
      return;
    }

    navigateHomeStack('ContentPlayer', { contentId: item.id });
  };

  const onClearSearch = () => {
    setSearchQuery('');
  };

  const showNotFound = searchQuery.trim().length > 0 && filteredResults.length === 0;

  const showRecent = isSearchFocused && searchQuery.trim().length === 0;

  if (showNotFound) {
    return (
      <NotFoundContentScreen
        onGoBack={() => {
          onClearSearch();
        }}
      />
    );
  }

  return (
    <LinearGradient
      colors={Colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.container}>
        {(() => {
          const listData: SearchListItem[] = showRecent ? recentSearches : filteredResults;
          return (
        <FlatList
          data={listData}
          keyExtractor={(item) => String((item as any).id)}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: tabBarHeight + 44,
          }}
          ListHeaderComponent={
            <View>
              <BlurView intensity={20} tint="dark" style={styles.searchBar}>
                <View style={styles.searchPill}>
                  <SearchIcon color="rgba(255,255,255,0.7)" size={18} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search artists or songs"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.searchInput}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                  {searchQuery.length > 0 ? (
                    <Pressable style={styles.clearBtn} onPress={onClearSearch}>
                      <X color="#fff" size={16} />
                    </Pressable>
                  ) : null}
                </View>
              </BlurView>

              <Text style={styles.sectionTitle}>
                {showRecent ? (isLoadingHistory ? 'Recent Searches…' : 'Recent Searches') : 'Results'}
              </Text>
            </View>
          }
          stickyHeaderIndices={[0]}
          renderItem={({ item }) => {
            if (showRecent) {
              const h = item as unknown as SearchHistoryItem;
              return (
                <BlurView intensity={18} tint="dark" style={styles.historyRow}>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => {
                      setSearchQuery(h.query);
                      setIsSearchFocused(true);
                      saveHistory(h.query).catch(() => undefined);
                    }}
                  >
                    <Text style={styles.historyText} numberOfLines={1}>
                      {h.query}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Delete recent search"
                    style={styles.historyDeleteBtn}
                    onPress={() => {
                      deleteHistoryItem(h.id).catch(() => undefined);
                    }}
                  >
                    <X color="#fff" size={16} />
                  </Pressable>
                </BlurView>
              );
            }

            const r = item as unknown as SearchResult;
            return (
              <Pressable style={styles.row} onPress={() => onPressResult(r)}>
                <View style={styles.thumbWrap}>
                  {r.artwork ? (
                    <Image
                      source={{ uri: r.artwork }}
                      style={r.type === 'ARTIST' ? styles.artistThumb : styles.songThumb}
                    />
                  ) : (
                    <View style={r.type === 'ARTIST' ? styles.artistThumb : styles.songThumb} />
                  )}
                  {r.type === 'SONG' && r.isLocked ? (
                    <View style={styles.lockBadge}>
                      <Lock color="#fff" size={12} />
                    </View>
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {r.type === 'ARTIST' ? 'Artist' : r.artistName}
                  </Text>
                </View>
                <Text style={styles.typeChip}>{r.type}</Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={<View style={styles.emptySpacer} />}
        />
          );
        })()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  list: {
    backgroundColor: 'transparent',
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.50)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    fontSize: 14,
    height: 44,
  },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  historyText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  historyDeleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginLeft: 10,
  },
  thumbWrap: {
    width: 52,
    height: 52,
    marginRight: 12,
  },
  artistThumb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  songThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  lockBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 24,
    height: 24,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sub: {
    color: Colors.textMuted,
    marginTop: 4,
    fontSize: 12,
  },
  typeChip: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 0.4,
  },
  emptyWrap: {
    paddingTop: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: 18,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,122,24,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,122,24,0.35)',
  },
  emptyBtnText: {
    color: '#FF7A18',
    fontWeight: '800',
  },
  emptySpacer: {
    height: 180,
  },
});
