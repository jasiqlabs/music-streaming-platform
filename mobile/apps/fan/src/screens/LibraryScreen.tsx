import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BadgeCheck, Pause, Play, Search } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '../theme';

type SubscribedArtist = {
  id: string;
  name: string;
  label: string;
  artwork: string;
  verified: boolean;
  status: 'Active' | 'Canceled';
  renewDate: string;
};

type RecentlyPlayedItem = {
  id: string;
  title: string;
  artistName: string;
  artwork: string;
  duration: string;
};

export default function LibraryScreen({ navigation }: any) {
  const tabBarHeight = useBottomTabBarHeight();

  const [subscribedArtists, setSubscribedArtists] = useState<SubscribedArtist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedItem[]>([]);

  const [currentSong, setCurrentSong] = useState<RecentlyPlayedItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const mockSubs: SubscribedArtist[] = [
      {
        id: 'luna-ray',
        name: 'Luna Ray',
        label: 'Dusian',
        artwork:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
        verified: true,
        status: 'Active',
        renewDate: 'May 24, 2024',
      },
      {
        id: 'david-stone',
        name: 'David Stone',
        label: 'Dusian',
        artwork:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=900&q=80',
        verified: false,
        status: 'Active',
        renewDate: 'Jun 02, 2024',
      },
      {
        id: 'kari-lucas',
        name: 'Kari Lucas',
        label: 'Dusian',
        artwork:
          'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=80',
        verified: false,
        status: 'Active',
        renewDate: 'Jun 11, 2024',
      },
    ];

    const mockRecent: RecentlyPlayedItem[] = [
      {
        id: 'secret-melody',
        title: 'Secret Melody',
        artistName: 'Luna Ray',
        artwork:
          'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1400&q=80',
        duration: '4:12',
      },
      {
        id: 'ethereal-dream',
        title: 'Ethereal Dream (Video)',
        artistName: 'Luna Ray',
        artwork:
          'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1400&q=80',
        duration: '6:21',
      },
    ];

    setSubscribedArtists(mockSubs);
    setRecentlyPlayed(mockRecent);
    setCurrentSong(mockRecent[0]);
  }, []);

  const miniProgress = useMemo(() => 0.4, []);

  return (
    <LinearGradient
      colors={Colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 140 }}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Library</Text>
            <Pressable onPress={() => {}} style={styles.headerIconBtn}>
              <Search color="rgba(255,255,255,0.75)" size={18} />
            </Pressable>
          </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Subscribed Artists</Text>
          <Pressable onPress={() => {}}>
            <Text style={styles.manageText}>Manage  &gt;</Text>
          </Pressable>
        </View>

        {subscribedArtists.length > 0 ? (
          <View style={styles.subListWrap}>
            {subscribedArtists.map((a) => (
              <Pressable
                key={a.id}
                style={styles.subRow}
                onPress={() => navigation.navigate('SubscriptionDetail', { artistId: a.id })}
              >
                <Image source={{ uri: a.artwork }} style={styles.subAvatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.subNameRow}>
                    <Text style={styles.subName} numberOfLines={1}>
                      {a.name}
                    </Text>
                    {a.verified ? (
                      <View style={{ marginLeft: 8, marginTop: 2 }}>
                        <BadgeCheck color="#4AA3FF" fill="#4AA3FF" size={16} />
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.subLabel} numberOfLines={1}>
                    {a.label}
                  </Text>
                </View>
                <Text style={styles.chev}>&gt;</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionTitleSolo}>Recently Played</Text>
        <FlatList
          data={recentlyPlayed}
          horizontal
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 10 }}
          renderItem={({ item }) => (
            <Pressable style={styles.recentCard} onPress={() => setCurrentSong(item)}>
              <ImageBackground
                source={{ uri: item.artwork }}
                style={styles.recentImg}
                imageStyle={styles.recentImgStyle}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.75)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.durationPill}>
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
              </ImageBackground>
              <Text style={styles.recentTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.recentArtist} numberOfLines={1}>
                {item.artistName}
              </Text>
            </Pressable>
          )}
        />

        {subscribedArtists.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Your personal library</Text>
            <Text style={styles.emptySub}>Subscribe to artists you love to fill this space</Text>
            <Pressable
              style={styles.browseBtn}
              onPress={() => navigation.getParent()?.navigate('HomeTab', { screen: 'HomeIndex' })}
            >
              <LinearGradient
                colors={['rgba(255,122,24,0.22)', 'rgba(255,122,24,0.12)']}
                style={styles.browseBtnInner}
              >
                <Text style={styles.browseBtnText}>Browse Artists</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : null}
        </ScrollView>

      {currentSong ? (
        <View style={[styles.miniWrap, { bottom: tabBarHeight + 12 }]}>
          <BlurView intensity={26} tint="dark" style={styles.miniPlayer}>
            <Image source={{ uri: currentSong.artwork }} style={styles.miniThumb} />
            <View style={styles.miniMeta}>
              <Text style={styles.miniTitle} numberOfLines={1}>
                {currentSong.title}
              </Text>
              <Text style={styles.miniArtist} numberOfLines={1}>
                {currentSong.artistName}
              </Text>
              <View style={styles.miniProgress}>
                <View style={[styles.miniProgressFill, { width: `${miniProgress * 100}%` }]} />
              </View>
            </View>
            <Pressable onPress={() => setIsPlaying((p) => !p)} style={styles.miniBtn}>
              {isPlaying ? (
                <Pause color="#fff" fill="#fff" size={22} />
              ) : (
                <Play color="#fff" fill="#fff" size={22} />
              )}
            </Pressable>
          </BlurView>
        </View>
      ) : null}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '700',
  },
  manageText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '700',
  },
  subListWrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  subAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  subNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  subLabel: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '600',
  },
  chev: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 10,
  },
  sectionTitleSolo: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  recentCard: {
    width: 168,
    marginRight: 12,
  },
  recentImg: {
    width: 168,
    height: 92,
  },
  recentImgStyle: {
    borderRadius: 18,
  },
  durationPill: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  durationText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '800',
  },
  recentTitle: {
    marginTop: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  recentArtist: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyWrap: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  browseBtn: {
    marginTop: 16,
    height: 50,
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,122,24,0.35)',
  },
  browseBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseBtnText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '800',
  },
  miniWrap: {
    position: 'absolute',
    left: 15,
    right: 15,
  },
  miniPlayer: {
    height: 70,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(18,18,18,0.78)',
  },
  miniThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
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
    marginTop: 3,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  miniProgress: {
    marginTop: 8,
    height: 2,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  miniBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
