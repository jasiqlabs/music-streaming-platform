import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  ToastAndroid,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ArrowLeft, Pause, Play, Settings } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Audio, type AVPlaybackStatus } from 'expo-av';
import { useConnectivity } from '../providers/ConnectivityProvider';

type Content = {
  id: string;
  title: string;
  artist: string;
  description: string;
  thumbnail: string;
  isLocked: boolean;
};

export default function ContentPlayerScreen({ navigation, route }: any) {
  const tabBarHeight = useBottomTabBarHeight();
  const { isConnected, isInternetReachable } = useConnectivity();

  const [currentContent, setCurrentContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [wasPlayingBeforeOffline, setWasPlayingBeforeOffline] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekProgress, setSeekProgress] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  
  // Subscription expiry state for testing
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
  const [showDebugToggle, setShowDebugToggle] = useState(__DEV__);

  const soundRef = useRef<Audio.Sound | null>(null);
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const lastStatusRef = useRef<AVPlaybackStatus | null>(null);

  const contentId = route?.params?.contentId;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);

        // API-ready: replace this block later with:
        // const res = await apiV1.get(`/content/${contentId}`)
        // setCurrentContent(res.data)
        const mock: Content = {
          id: typeof contentId === 'string' && contentId.length > 0 ? contentId : '1',
          title: 'Secret Melody',
          artist: 'Luna Ray',
          description:
            'Experience a serene and mystical journey with\n the soothing melodies of Luna Ray.',
          thumbnail:
            'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1400&q=80',
          isLocked: false,
        };

        if (mounted) setCurrentContent(mock);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [contentId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentContent) return;
      try {
        setIsPlaying(false);
        setPositionMs(0);
        setDurationMs(0);
        progressOpacity.setValue(0);

        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // Future: POST /v1/stream/access to get signed URL before starting the audio.
        const demoUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

        const { sound } = await Audio.Sound.createAsync(
          { uri: demoUrl },
          { shouldPlay: false },
          (status) => {
            if (!mounted) return;
            if (!status.isLoaded) return;
            lastStatusRef.current = status;
            if (!isSeeking) {
              if (typeof status.positionMillis === 'number') setPositionMs(status.positionMillis);
            }
            if (typeof status.durationMillis === 'number') setDurationMs(status.durationMillis);
            if (typeof status.isPlaying === 'boolean') setIsPlaying(status.isPlaying);
          }
        );

        soundRef.current = sound;
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentContent, progressOpacity]);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const status = lastStatusRef.current;
        if (!status || !status.isLoaded) return;
        if (isSeeking) return;
        if (typeof status.positionMillis === 'number') setPositionMs(status.positionMillis);
        if (typeof status.durationMillis === 'number') setDurationMs(status.durationMillis);
        if (typeof status.isPlaying === 'boolean') setIsPlaying(status.isPlaying);
      } catch {
        // ignore
      }
    }, 500);

    return () => {
      clearInterval(id);
    };
  }, [isSeeking]);

  useEffect(() => {
    Animated.timing(progressOpacity, {
      toValue: isPlaying ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isPlaying, progressOpacity]);

  useEffect(() => {
    // Handle offline state - pause audio and show toast
    const handleOfflineState = async () => {
      if (!isConnected || !isInternetReachable) {
        if (isPlaying) {
          setWasPlayingBeforeOffline(true);
          try {
            const sound = soundRef.current;
            if (sound) {
              const status = await sound.getStatusAsync();
              if (status.isLoaded && status.isPlaying) {
                await sound.pauseAsync();
              }
            }
          } catch (error) {
            console.error('Error pausing audio:', error);
          }
        }
        
        // Show offline message
        const message = 'Waiting for network...';
        if (Platform.OS === 'android') {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
          Alert.alert('Offline', message);
        }
      } else if (wasPlayingBeforeOffline) {
        // Resume playback when connection is restored
        setWasPlayingBeforeOffline(false);
        try {
          const sound = soundRef.current;
          if (sound) {
            const status = await sound.getStatusAsync();
            if (status.isLoaded && !status.isPlaying) {
              await sound.playAsync();
            }
          }
        } catch (error) {
          console.error('Error resuming audio:', error);
        }
      }
    };

    handleOfflineState();
  }, [isConnected, isInternetReachable, isPlaying, wasPlayingBeforeOffline]);

  useEffect(() => {
    return () => {
      (async () => {
        try {
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }
        } catch {
          // ignore
        }
      })();
    };
  }, []);

  const onBack = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } finally {
      navigation.goBack();
    }
  };

  const handlePlayPress = async () => {
    if (!currentContent) return;

    // Check subscription status before playing
    if (!isSubscriptionActive) {
      const message = 'Cannot play while subscription is expired. Please renew your subscription.';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        Alert.alert('Subscription Expired', message);
      }
      return;
    }

    // Check network connectivity before playing
    if (!isConnected || !isInternetReachable) {
      const message = 'Cannot play while offline. Please check your connection.';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        Alert.alert('Offline', message);
      }
      return;
    }

    // Future: POST /v1/stream/access to get signed URL before starting the audio.
    // Then use expo-audio (or expo-av) to play the signedUrl.

    try {
      const sound = soundRef.current;
      if (!sound) return;
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch {
      setIsPlaying(false);
    }
  };

  const formatTime = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const progress = durationMs > 0 ? Math.min(1, Math.max(0, positionMs / durationMs)) : 0;
  const displayedProgress = isSeeking ? seekProgress : progress;
  const remainingMs = Math.max(0, durationMs - positionMs);

  const seekToProgress = async (nextProgress: number) => {
    const sound = soundRef.current;
    if (!sound) return;

    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;

    const nextDuration = typeof status.durationMillis === 'number' ? status.durationMillis : durationMs;
    if (!nextDuration || nextDuration <= 0) return;

    const nextMs = Math.max(0, Math.min(nextDuration, Math.round(nextProgress * nextDuration)));
    await sound.setPositionAsync(nextMs);
    setPositionMs(nextMs);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setIsSeeking(true);
          setSeekProgress(displayedProgress);
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (trackWidth <= 0) return;
          const x = Math.max(0, Math.min(trackWidth, gestureState.dx + displayedProgress * trackWidth));
          setSeekProgress(x / trackWidth);
        },
        onPanResponderRelease: async () => {
          const next = Math.min(1, Math.max(0, seekProgress));
          try {
            await seekToProgress(next);
          } finally {
            setIsSeeking(false);
          }
        },
        onPanResponderTerminate: () => {
          setIsSeeking(false);
        },
      }),
    [displayedProgress, seekProgress, trackWidth, durationMs]
  );

  const mini = useMemo(
    () => ({
      title: 'Midnight Dreams',
      artist: 'Luna Ray',
      thumbnail:
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
    }),
    []
  );

  if (isLoading || !currentContent) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FF6A00" />
      </View>
    );
  }

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
                Sub: {isSubscriptionActive ? 'Active' : 'Expired'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Image source={{ uri: currentContent.thumbnail }} style={styles.bgImg} blurRadius={32} />
        <LinearGradient
          colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.92)']}
          style={styles.bgGradient}
        />

        <Pressable onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={22} />
        </Pressable>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{currentContent.title}</Text>
          <Text style={styles.artist}>{currentContent.artist}</Text>
        </View>

        <View style={styles.centerWrap}>
          <Pressable onPress={handlePlayPress} style={styles.playOuter}>
            <LinearGradient
              colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
              style={styles.playOuterGrad}
            >
              <View style={styles.playInner}>
                {isPlaying ? (
                  <Pause color="#fff" fill="#fff" size={30} />
                ) : (
                  <Play color="#fff" fill="#fff" size={30} />
                )}
              </View>
            </LinearGradient>
          </Pressable>

          <Text style={styles.description}>{currentContent.description}</Text>
        </View>

        <Animated.View style={[styles.progressWrap, { opacity: progressOpacity, bottom: tabBarHeight + 92 }]}>
          <View style={styles.progressRow}>
            <Text style={styles.progressTime}>{formatTime(positionMs)}</Text>
            <Pressable
              style={styles.progressTrack}
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
              onPress={async (e) => {
                if (trackWidth <= 0) return;
                const x = e.nativeEvent.locationX;
                const next = Math.min(1, Math.max(0, x / trackWidth));
                await seekToProgress(next);
              }}
            >
              <View style={[styles.progressFill, { width: `${displayedProgress * 100}%` }]} />
              <View
                style={[styles.progressDot, { left: `${displayedProgress * 100}%` }]}
                {...panResponder.panHandlers}
              />
            </Pressable>
            <Text style={styles.progressTime}>-{formatTime(remainingMs)}</Text>
          </View>
        </Animated.View>

        <View style={[styles.miniWrap, { bottom: tabBarHeight + 12 }]}>
          <View style={styles.miniPlayer}>
            <Image source={{ uri: mini.thumbnail }} style={styles.miniThumb} />
            <View style={styles.miniMeta}>
              <Text style={styles.miniTitle} numberOfLines={1}>
                {mini.title}
              </Text>
              <Text style={styles.miniArtist} numberOfLines={1}>
                {mini.artist}
              </Text>
              <View style={styles.miniProgress}>
                <View style={[styles.miniProgressFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
            <Pressable onPress={handlePlayPress} style={styles.miniBtn}>
              {isPlaying ? (
                <Pause color="#fff" fill="#fff" size={22} />
              ) : (
                <Play color="#fff" fill="#fff" size={22} />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgImg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  headerTextWrap: {
    position: 'absolute',
    top: 140,
    left: 22,
    right: 22,
    alignItems: 'flex-start',
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  artist: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  playOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
  },
  playOuterGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 2,
    borderColor: 'rgba(255,122,24,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    marginTop: 26,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  progressWrap: {
    position: 'absolute',
    left: 22,
    right: 22,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTime: {
    width: 44,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF7A18',
  },
  progressDot: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF7A18',
    marginLeft: -6,
  },

  miniWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
  },
  miniPlayer: {
    height: 70,
    borderRadius: 18,
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
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Debug styles
  debugToggle: {
    position: 'absolute',
    top: 12,
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
