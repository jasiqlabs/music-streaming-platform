import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BadgeCheck, Lock, Pause, Play, Search, SkipForward } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type ArtistCard = {
  id: string;
  name: string;
  subText: string;
  image: string;
  isVerified?: boolean;
  isSubscriptionBased?: boolean;
};

type ContentCard = {
  id: string;
  title: string;
  artist: string;
  description: string;
  thumbnail: string;
  isLocked: boolean;
};

export default function HomeScreen({ navigation }: any) {
  const tabBarHeight = useBottomTabBarHeight();

  const [loading, setLoading] = useState(true);
  const [featuredArtists, setFeaturedArtists] = useState<ArtistCard[]>([]);
  const [trendingArtists, setTrendingArtists] = useState<ArtistCard[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<ContentCard[]>([]);

  const [currentSong, setCurrentSong] = useState<ContentCard | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        const mockFeatured: ArtistCard[] = [
          {
            id: 'luna-ray',
            name: 'Luna Ray',
            subText: 'Subscription Based',
            image:
              'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80',
            isVerified: true,
            isSubscriptionBased: true,
          },
          {
            id: 'david-stone',
            name: 'David Stone',
            subText: 'Bogaert',
            image:
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=1000&q=80',
          },
          {
            id: 'violet-deen',
            name: 'Violet Deen',
            subText: 'Bogaert',
            image:
              'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=1000&q=80',
          },
        ];

        const mockTrending: ArtistCard[] = [
          {
            id: 'kari-lucas',
            name: 'Kari Lucas',
            subText: 'Dusian',
            image:
              'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?auto=format&fit=crop&w=800&q=80',
          },
          {
            id: 'derek-maas',
            name: 'Derek Maas',
            subText: 'Dusian',
            image:
              'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80',
          },
          {
            id: 'luna-ray-trending',
            name: 'Luna Ray',
            subText: 'Dusian',
            image:
              'https://images.unsplash.com/photo-1524503033411-f6e95c1c530f?auto=format&fit=crop&w=800&q=80',
            isVerified: true,
          },
          {
            id: 'violet-deen-trending',
            name: 'Violet Deen',
            subText: 'Bogaert',
            image:
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
          },
        ];

        const mockRecently: ContentCard[] = [
          {
            id: 'secret-melody',
            title: 'Secret Melody',
            artist: 'Luna Ray',
            description:
              'Experience a serene and mystical journey with\n the soothing melodies of Luna Ray.',
            thumbnail:
              'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1400&q=80',
            isLocked: true,
          },
          {
            id: 'midnight-dreams',
            title: 'Midnight Dreams',
            artist: 'Luna Ray',
            description: 'A premium late-night vibe with warm synths.',
            thumbnail:
              'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
            isLocked: false,
          },
          {
            id: 'golden-skies',
            title: 'Golden Skies',
            artist: 'David Stone',
            description: 'Cinematic build-ups and bright textures.',
            thumbnail:
              'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
            isLocked: false,
          },
        ];

        if (!mounted) return;
        setFeaturedArtists(mockFeatured);
        setTrendingArtists(mockTrending);
        setRecentlyAdded(mockRecently);
        setCurrentSong(mockRecently[0]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const miniProgress = useMemo(() => 0.4, []);

  const onPressArtist = (artistId: string) => {
    navigation.navigate('Artist', { artistId });
  };

  const onPressContent = (item: ContentCard) => {
    if (item.isLocked) {
      navigation.navigate('ArtistSubscription', {
        song: {
          id: item.id,
          title: item.title,
          artist: item.artist,
          duration: '3:12',
          thumbnail: item.thumbnail,
          locked: true,
        },
        coverImage: item.thumbnail,
      });
      return;
    }

    navigation.navigate('ContentPlayer', { contentId: item.id });
  };

  const onPressSeeAllTrending = () => {
    navigation.navigate('SeeAllTrending', {
      artists: trendingArtists,
    });
  };

  const renderFeaturedArtist = ({ item }: { item: ArtistCard }) => (
    <Pressable style={styles.featuredCard} onPress={() => onPressArtist(item.id)}>
      <Image source={{ uri: item.image }} style={styles.featuredImg} />
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.85)']}
        style={styles.featuredOverlay}
      />

      <View style={styles.featuredTextWrap}>
        <View style={styles.featuredNameRow}>
          <Text style={styles.featuredArtistName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isVerified ? (
            <View style={styles.verifiedWrap}>
              <BadgeCheck color="#4AA3FF" fill="#4AA3FF" size={18} />
            </View>
          ) : null}
        </View>

        {item.isSubscriptionBased ? (
          <View style={styles.subscriptionTag}>
            <Text style={styles.subscriptionTagText}>{item.subText}</Text>
          </View>
        ) : (
          <Text style={styles.featuredSubText}>{item.subText}</Text>
        )}
      </View>
    </Pressable>
  );

  const renderTrendingArtist = ({ item }: { item: ArtistCard }) => (
    <Pressable style={styles.trendingCard} onPress={() => onPressArtist(item.id)}>
      <Image source={{ uri: item.image }} style={styles.trendingImg} />
      <Text style={styles.trendingName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.trendingSubText} numberOfLines={1}>
        {item.subText}
      </Text>
    </Pressable>
  );

  const renderRecentlyAdded = ({ item }: { item: ContentCard }) => (
    <Pressable style={styles.recentCard} onPress={() => onPressContent(item)}>
      <Image source={{ uri: item.thumbnail }} style={styles.recentImg} />
      {item.isLocked ? (
        <View style={styles.lockPill}>
          <Lock color="#fff" size={14} />
        </View>
      ) : null}
    </Pressable>
  );

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FF6A00" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 140 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>

          <Pressable
            onPress={() =>
              navigation.getParent()?.navigate('Search')
            }
          >
            <Search color="#fff" size={22} />
          </Pressable>
        </View>

        {/* FEATURED ARTISTS */}
        <Text style={styles.sectionTitleTop}>Featured Artists</Text>
        <FlatList
          data={featuredArtists}
          horizontal
          renderItem={renderFeaturedArtist}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={{ paddingLeft: 18, paddingRight: 8 }}
        />

        {/* TRENDING ARTISTS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Trending Artists</Text>
          <TouchableOpacity onPress={onPressSeeAllTrending} activeOpacity={0.7}>
            <Text style={styles.seeAll}>See All  &gt;</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={trendingArtists}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 18, paddingRight: 8 }}
          renderItem={renderTrendingArtist}
          keyExtractor={(item) => item.id}
          nestedScrollEnabled
        />

        {/* RECENTLY ADDED */}
        <Text style={styles.sectionTitleTop}>Recently Added</Text>
        <FlatList
          data={recentlyAdded}
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={{ paddingLeft: 18, paddingRight: 8 }}
          renderItem={renderRecentlyAdded}
          keyExtractor={(item) => item.id}
        />
      </ScrollView>

      {/* MINI PLAYER */}
      {currentSong && (
        <View
          style={[
            styles.miniPlayer,
            { bottom: tabBarHeight + 12 },
          ]}
        >
          <Image
            source={{ uri: currentSong.thumbnail }}
            style={styles.miniPlayerImg}
          />

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.miniSongTitle}>
              {currentSong.title}
            </Text>
            <Text style={styles.miniArtistName}>
              {currentSong.artist}
            </Text>
            <View style={styles.miniProgressTrack}>
              <View style={[styles.miniProgressFill, { width: `${miniProgress * 100}%` }]} />
            </View>
          </View>

          <Pressable onPress={() => setIsPlaying(!isPlaying)} style={styles.miniControlBtn}>
            {isPlaying ? (
              <Pause color="#fff" size={22} />
            ) : (
              <Play color="#fff" size={22} />
            )}
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.miniControlBtn, { marginLeft: 10 }]}>
            <SkipForward color="#fff" size={20} />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ================================= */
/* STYLES */
/* ================================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  sectionTitleTop: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 18,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 22,
    marginBottom: 10,
  },

  seeAll: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '600',
  },

  featuredCard: {
    width: width * 0.62,
    height: 178,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  featuredImg: { width: '100%', height: '100%' },

  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  featuredTextWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
  },

  featuredNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  featuredArtistName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    flex: 0,
  },

  verifiedWrap: {
    marginLeft: 8,
    marginTop: 2,
  },

  subscriptionTag: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,122,24,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,122,24,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  subscriptionTagText: {
    color: '#FF7A18',
    fontSize: 11,
    fontWeight: '800',
  },

  featuredSubText: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },

  sectionTitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '700',
  },

  trendingCard: {
    width: 96,
    marginRight: 12,
  },
  trendingImg: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  trendingName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  trendingSubText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  recentCard: {
    width: width * 0.48,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  recentImg: {
    width: '100%',
    height: '100%',
  },
  lockPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  miniPlayer: {
    position: 'absolute',
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
    fontWeight: 'bold',
  },

  miniArtistName: {
    color: '#888',
  },

  miniProgressTrack: {
    marginTop: 8,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },

  miniControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
