import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Pause, Play, Search as SearchIcon, X } from 'lucide-react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import NotFoundContentScreen from './NotFoundContentScreen';

type SearchResult = {
  id: string;
  title: string;
  artistName: string;
  artwork: string;
  type: 'ARTIST' | 'SONG';
  isLocked: boolean;
};

export default function SearchScreen({ navigation }: any) {
  const tabBarHeight = useBottomTabBarHeight();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [allContent, setAllContent] = useState<SearchResult[]>([]);

  const [currentSong, setCurrentSong] = useState<SearchResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const mock: SearchResult[] = [
      {
        id: 'luna-ray',
        title: 'Luna Ray',
        artistName: 'Subscription Based',
        artwork:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
        type: 'ARTIST',
        isLocked: false,
      },
      {
        id: 'david-stone',
        title: 'David Stone',
        artistName: 'Bogaert',
        artwork:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=900&q=80',
        type: 'ARTIST',
        isLocked: false,
      },
      {
        id: 'secret-melody',
        title: 'Secret Melody',
        artistName: 'Luna Ray',
        artwork:
          'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1400&q=80',
        type: 'SONG',
        isLocked: true,
      },
      {
        id: 'midnight-dreams',
        title: 'Midnight Dreams',
        artistName: 'Luna Ray',
        artwork:
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
        type: 'SONG',
        isLocked: false,
      },
      {
        id: 'golden-skies',
        title: 'Golden Skies',
        artistName: 'David Stone',
        artwork:
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
        type: 'SONG',
        isLocked: false,
      },
    ];

    setAllContent(mock);
    setFilteredResults(mock);
    setCurrentSong(mock.find((x) => x.type === 'SONG') ?? null);
  }, []);

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

  const miniProgress = useMemo(() => 0.4, []);

  const showNotFound = searchQuery.trim().length > 0 && filteredResults.length === 0;

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
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredResults}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: currentSong ? tabBarHeight + 124 : tabBarHeight + 44,
        }}
        ListHeaderComponent={
          <View>
            <View style={styles.searchBar}>
              <View style={styles.searchPill}>
                <SearchIcon color="rgba(255,255,255,0.55)" size={18} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search artists or songs"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                />
                {searchQuery.length > 0 ? (
                  <Pressable style={styles.clearBtn} onPress={onClearSearch}>
                    <X color="#fff" size={16} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <Text style={styles.sectionTitle}>Results</Text>
          </View>
        }
        stickyHeaderIndices={[0]}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => onPressResult(item)}>
            <View style={styles.thumbWrap}>
              <Image
                source={{ uri: item.artwork }}
                style={item.type === 'ARTIST' ? styles.artistThumb : styles.songThumb}
              />
              {item.type === 'SONG' && item.isLocked ? (
                <View style={styles.lockBadge}>
                  <Lock color="#fff" size={12} />
                </View>
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {item.type === 'ARTIST' ? 'Artist' : item.artistName}
              </Text>
            </View>
            <Text style={styles.typeChip}>{item.type}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<View style={styles.emptySpacer} />}
      />

      {currentSong ? (
        <View style={[styles.miniPlayer, { bottom: tabBarHeight + 12 }]}>
          <Image
            source={{ uri: currentSong.artwork }}
            style={styles.miniPlayerImg}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.miniSongTitle} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.miniArtistName} numberOfLines={1}>
              {currentSong.artistName}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${miniProgress * 100}%` }]} />
            </View>
          </View>
          <View style={styles.miniControls}>
            <Pressable onPress={() => setIsPlaying((v) => !v)}>
              {isPlaying ? (
                <Pause color="#fff" fill="#fff" size={24} />
              ) : (
                <Play color="#fff" fill="#fff" size={24} />
              )}
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#000',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 10,
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
    color: 'rgba(255,255,255,0.55)',
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
  miniPlayer: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    height: 70,
    backgroundColor: 'rgba(18,18,18,0.78)',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  miniPlayerImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  miniSongTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  miniArtistName: {
    color: '#888',
    fontSize: 12,
  },
  progressBar: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginTop: 8,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  miniControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
});
