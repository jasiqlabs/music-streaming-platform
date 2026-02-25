import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ArrowLeft, BadgeCheck, Lock, Pause, Play, Settings } from 'lucide-react-native';
import { ResizeMode, Video } from 'expo-av';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SubscriptionExpiryScreen from './SubscriptionExpiryScreen';
import { fetchArtistById, fetchArtistMedia, type ArtistDetail, type ArtistMediaItem } from '../services/artistService';
import { useMediaPlayer } from '../providers/MediaPlayerProvider';
import YouTubeVideoControlsOverlay from '../ui/YouTubeVideoControlsOverlay';

type Song = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  locked: boolean;
  mediaType: 'audio' | 'video';
  mediaUrl: string;
};

type Artist = {
  id: string;
  name: string;
  verified: boolean;
  subscribers: string;
  coverImage: string;
};

type TabKey = 'All' | 'Audio' | 'Video';

const TABS: TabKey[] = ['All', 'Audio', 'Video'];

export default function ArtistScreen({ navigation, route }: any) {
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();

  const {
    playQueue,
    currentItem,
    state: playerState,
    videoRef,
    onVideoPlaybackStatusUpdate,
    togglePlayPause,
    seekTo,
    setExpanded,
    setInlineVideoHostActive,
  } = useMediaPlayer();

  useEffect(() => {
    const isInlineVideo = isFocused && currentItem?.mediaType === 'video' && !playerState.isExpanded;
    setInlineVideoHostActive(isInlineVideo);
    return () => {
      setInlineVideoHostActive(false);
    };
  }, [currentItem?.mediaType, isFocused, playerState.isExpanded, setInlineVideoHostActive]);

  const [activeTab, setActiveTab] = useState<TabKey>('All');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Subscription expiry state with debug toggle
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
  const [showDebugToggle, setShowDebugToggle] = useState(__DEV__);

  const handleRenewSubscription = () => {
    navigation.navigate('SubscriptionFlow');
    setIsSubscriptionActive(true); // Reset after navigation
  };

  const artistId = (route?.params?.artistId ?? '').toString();
  const initialMediaId = (route?.params?.contentId ?? '').toString();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [artistRes, mediaRes] = await Promise.all([
          fetchArtistById(artistId),
          fetchArtistMedia(artistId),
        ]);

        if (!mounted) return;

        const a: ArtistDetail | null = artistRes;
        if (!a) {
          setArtist(null);
          setSongs([]);
          setError('Artist not found');
          return;
        }

        const normalizedArtist: Artist = {
          id: a.id,
          name: a.name,
          verified: a.isVerified,
          subscribers: a.genre ? a.genre : 'Artist',
          coverImage: a.coverImageUrl,
        };

        const toSong = (it: ArtistMediaItem): Song => ({
          id: it.id,
          title: it.title,
          artist: a.name,
          duration: it.mediaType === 'video' ? 'Video' : 'Audio',
          thumbnail: it.artworkUrl,
          locked: it.locked,
          mediaType: it.mediaType,
          mediaUrl: it.mediaUrl,
        });

        setArtist(normalizedArtist);
        setSongs(mediaRes.map(toSong));
      } catch {
        if (!mounted) return;
        setError('Failed to load artist');
        setArtist(null);
        setSongs([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [artistId]);

  useEffect(() => {
    if (!artist) return;
    if (!initialMediaId) return;
    if (!songs.length) return;

    const match = songs.find((s) => s.id === initialMediaId);
    if (!match) return;

    if (match.mediaType === 'audio') setActiveTab('Audio');
    if (match.mediaType === 'video') setActiveTab('Video');

    const queue = songs
      .filter((s) => Boolean(s.mediaUrl))
      .map((s) => ({
        id: s.id,
        title: s.title,
        artistName: s.artist,
        mediaType: s.mediaType,
        artworkUrl: s.thumbnail,
        mediaUrl: s.mediaUrl,
        isLocked: s.locked,
      }));
    const idx = queue.findIndex((q) => q.id === initialMediaId);
    if (idx < 0) return;

    playQueue(queue, idx).catch(() => undefined);
    setCurrentSong(match);
  }, [artist, initialMediaId, playQueue, songs]);

  const isUnlocked = Boolean(route?.params?.unlocked);

  const filteredSongs = useMemo(() => {
    const baseSongs = isUnlocked ? songs.map((s) => ({ ...s, locked: false })) : songs;
    if (activeTab === 'All') return baseSongs;
    if (activeTab === 'Audio') return baseSongs.filter((s) => s.mediaType === 'audio');
    return baseSongs.filter((s) => s.mediaType === 'video');
  }, [activeTab, isUnlocked, songs]);

  // Disable audio playback when subscription is expired
  const handleSongPress = (song: Song) => {
    if (!artist) return;
    if (!isSubscriptionActive) {
      return; // Block all playback when subscription is expired
    }
    
    if (song.locked && !isUnlocked) {
      navigation.navigate('ArtistSubscription', {
        song: song,
        coverImage: artist.coverImage,
      });
      return;
    }
    const queue = filteredSongs
      .filter((s) => Boolean(s.mediaUrl))
      .map((s) => ({
        id: s.id,
        title: s.title,
        artistName: s.artist,
        mediaType: s.mediaType,
        artworkUrl: s.thumbnail,
        mediaUrl: s.mediaUrl,
        isLocked: s.locked,
      }));
    const idx = queue.findIndex((q) => q.id === song.id);
    playQueue(queue, idx >= 0 ? idx : 0).catch(() => undefined);
    setCurrentSong(song);
  };

  useEffect(() => {
    if (!artist) return;
    Image.prefetch(artist.coverImage);
    songs.forEach((s) => {
      if (s.thumbnail) Image.prefetch(s.thumbnail);
    });
  }, [artist, songs]);

  useEffect(() => {
    if (!currentSong) setCurrentSong(songs[0] ?? null);
  }, [songs, currentSong]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.container}>
        {/* Debug Toggle */}
        {showDebugToggle && (
          <View style={styles.debugToggle}>
            <TouchableOpacity
              style={[
                styles.debugButton,
                !isSubscriptionActive && styles.debugButtonActive
              ]}
              onPress={() => setIsSubscriptionActive(!isSubscriptionActive)}
            >
              <Settings size={16} color="#fff" />
              <Text style={styles.debugButtonText}>
                Subscription: {isSubscriptionActive ? 'Active' : 'Expired'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Subscription Expiry Guard Screen */}
        {!isSubscriptionActive && artist ? (
          <SubscriptionExpiryScreen artistName={artist.name} onRenewSubscription={handleRenewSubscription} />
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#FF6A00" />
          </View>
        ) : error || !artist ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.errorText}>{error || 'Unable to load artist.'}</Text>
          </View>
        ) : (
          <>
            {currentItem?.mediaType === 'video' ? (
              <View style={styles.youtubeVideoWrap}>
                <Video
                  ref={videoRef}
                  style={styles.youtubeVideo}
                  source={{ uri: currentItem.mediaUrl }}
                  shouldPlay={playerState.isPlaying}
                  resizeMode={ResizeMode.CONTAIN}
                  progressUpdateIntervalMillis={100}
                  onPlaybackStatusUpdate={onVideoPlaybackStatusUpdate}
                />

                <YouTubeVideoControlsOverlay
                  isPlaying={playerState.isPlaying}
                  positionMs={playerState.positionMs}
                  durationMs={playerState.durationMs}
                  onTogglePlay={() => {
                    togglePlayPause().catch(() => undefined);
                  }}
                  onSeek={(pos) => {
                    seekTo(pos).catch(() => undefined);
                  }}
                  isFullscreen={false}
                  onToggleFullscreen={() => setExpanded(true)}
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
                  style={styles.youtubeVideoTopGradient}
                />
                <View style={styles.youtubeVideoTopRow}>
                  <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={22} />
                  </Pressable>
                </View>
              </View>
            ) : (
              <ArtistHeader
                coverImage={artist.coverImage}
                name={artist.name}
                verified={artist.verified}
                subscribers={artist.subscribers}
                onBack={() => navigation.goBack()}
              />
            )}

            <GlassTabs active={activeTab} onChange={setActiveTab} />

            <FlatList
              data={filteredSongs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingBottom: tabBarHeight + 140,
              }}
              renderItem={({ item }) => <SongRow song={item} onPress={() => handleSongPress(item)} />}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.loadingWrap}>
                  <Text style={styles.emptyText}>No uploads yet.</Text>
                </View>
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function ArtistHeader({
  coverImage,
  name,
  verified,
  subscribers,
  onBack,
}: {
  coverImage: string;
  name: string;
  verified: boolean;
  subscribers: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.headerWrap}>
      <Image source={{ uri: coverImage }} style={styles.headerImg} />
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.9)']}
        style={styles.headerGradient}
      />

      <View style={styles.headerTopRow}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={22} />
        </Pressable>
      </View>

      <BlurView intensity={28} tint="dark" style={styles.headerGlass}>
        <View style={styles.headerTextRow}>
          <Text style={styles.artistName}>{name}</Text>
          {verified ? (
            <View style={styles.verifiedBadge}>
              <BadgeCheck color="#4AA3FF" fill="#4AA3FF" size={18} />
            </View>
          ) : null}
        </View>
        <Text style={styles.subscribers}>{subscribers}</Text>
      </BlurView>
    </View>
  );
}

function GlassTabs({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  const underlineX = useRef(new Animated.Value(0)).current;
  const tabWidth = 120;

  useEffect(() => {
    const index = TABS.indexOf(active);
    Animated.timing(underlineX, {
      toValue: index * tabWidth,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [active, tabWidth, underlineX]);

  return (
    <BlurView intensity={22} tint="dark" style={styles.tabsWrap}>
      <View style={styles.tabsRow}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            style={[styles.tabBtn, { width: tabWidth }]}
          >
            <Text style={[styles.tabText, active === t ? styles.tabTextActive : null]}>{t}</Text>
          </Pressable>
        ))}
        <Animated.View style={[styles.tabUnderline, { width: 40, transform: [{ translateX: underlineX }] }]} />
      </View>
    </BlurView>
  );
}

function SongRow({ song, onPress }: { song: Song; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.songRowPressable}>
      <BlurView intensity={18} tint="dark" style={styles.songRow}>
        <Image source={{ uri: song.thumbnail }} style={styles.songThumb} />
        <View style={styles.songMeta}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {song.artist}
          </Text>

          {song.locked ? (
            <View style={styles.lockedBadgeRow}>
              <LinearGradient colors={['rgba(255,122,24,0.6)', 'rgba(255,61,0,0.6)']} style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>LOCKED EARLY ACCESS</Text>
              </LinearGradient>
            </View>
          ) : null}
        </View>

        <View style={styles.songRight}>
          {song.locked ? <Lock color="#fff" size={16} /> : <View style={{ width: 16, height: 16 }} />}
          <Text style={styles.songDuration}>{song.duration}</Text>
        </View>
      </BlurView>
      <View style={styles.songDivider} />
    </Pressable>
  );
}

function MiniPlayerBar({
  bottomInset,
  song,
  isPlaying,
  onToggle,
}: {
  bottomInset: number;
  song: Song;
  isPlaying: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.miniWrap, { bottom: bottomInset + 12 }]}>
      <BlurView intensity={26} tint="dark" style={styles.miniPlayer}>
        <Image source={{ uri: song.thumbnail }} style={styles.miniThumb} />
        <View style={styles.miniMeta}>
          <Text style={styles.miniTitle} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={styles.miniArtist} numberOfLines={1}>
            {song.artist}
          </Text>
          <View style={styles.miniProgress}>
            <View style={styles.miniProgressFill} />
          </View>
        </View>

        <Pressable onPress={onToggle} style={styles.miniBtn}>
          {isPlaying ? <Pause color="#fff" fill="#fff" size={22} /> : <Play color="#fff" fill="#fff" size={22} />}
        </Pressable>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  youtubeVideoWrap: {
    height: 240,
    backgroundColor: '#000',
  },
  youtubeVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  youtubeVideoTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  youtubeVideoTopRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  errorText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  headerWrap: {
    height: 240,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
  },
  headerImg: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGlass: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistName: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  verifiedBadge: {
    marginLeft: 10,
    marginTop: 2,
  },
  subscribers: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '500',
  },

  tabsWrap: {
    marginTop: 14,
    marginHorizontal: 14,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabUnderline: {
    position: 'absolute',
    left: 40,
    bottom: 10,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#fff',
  },

  songRowPressable: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  songRow: {
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(20,20,20,0.35)',
  },
  songThumb: {
    width: 58,
    height: 58,
    borderRadius: 14,
  },
  songMeta: {
    flex: 1,
    marginLeft: 12,
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  songArtist: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  lockedBadgeRow: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  lockedBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lockedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  songRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 10,
  },
  songDuration: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  songDivider: {
    height: 1,
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  miniWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
  },
  miniPlayer: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(14,14,14,0.55)',
  },
  miniThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  miniMeta: {
    flex: 1,
    marginLeft: 12,
  },
  miniTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  miniArtist: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  miniProgress: {
    marginTop: 10,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  miniProgressFill: {
    width: '40%',
    height: '100%',
    backgroundColor: '#fff',
  },
  miniBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Debug styles
  debugToggle: {
    position: 'absolute',
    top: 10,
    right: 14,
    zIndex: 1000,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  debugButtonActive: {
    backgroundColor: 'rgba(255, 106, 0, 0.2)',
    borderColor: '#FF6A00',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
