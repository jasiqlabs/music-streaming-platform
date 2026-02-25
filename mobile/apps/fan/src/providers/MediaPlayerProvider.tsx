import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { Audio, type AVPlaybackStatus, Video } from 'expo-av';

import MediaPlayerOverlay from '../ui/MediaPlayerOverlay';

export type MediaType = 'audio' | 'video';

export type MediaItem = {
  id: string;
  title: string;
  artistName?: string;
  mediaType: MediaType;
  artworkUrl?: string | null;
  mediaUrl: string;
  isLocked?: boolean;
};

type PlayerState = {
  queue: MediaItem[];
  currentIndex: number;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  isExpanded: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'one' | 'all';
  playbackRate: number;
  volume: number;
};

type SoundLike = {
  unloadAsync: () => Promise<void>;
  getStatusAsync: () => Promise<AVPlaybackStatus>;
  pauseAsync: () => Promise<void>;
  playAsync: () => Promise<void>;
  setPositionAsync: (positionMillis: number) => Promise<void>;
  setRateAsync: (rate: number, shouldCorrectPitch: boolean) => Promise<void>;
  setVolumeAsync: (volume: number) => Promise<void>;
  setProgressUpdateIntervalAsync: (progressUpdateIntervalMillis: number) => Promise<void>;
};

type MediaPlayerContextValue = {
  state: PlayerState;
  currentItem: MediaItem | null;
  playQueue: (queue: MediaItem[], index: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrev: () => Promise<void>;
  setShuffle: (enabled: boolean) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: PlayerState['repeatMode']) => void;
  cycleRepeatMode: () => void;
  setPlaybackRate: (rate: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  close: () => Promise<void>;
  setExpanded: (expanded: boolean) => void;

  inlineVideoHostActive: boolean;
  setInlineVideoHostActive: (active: boolean) => void;

  onVideoPlaybackStatusUpdate: (status: AVPlaybackStatus) => void;

  videoRef: React.RefObject<Video>;
};

const MediaPlayerContext = createContext<MediaPlayerContextValue | undefined>(undefined);

const EMPTY_STATE: PlayerState = {
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  isExpanded: false,
  isShuffle: false,
  repeatMode: 'off',
  playbackRate: 1,
  volume: 1,
};

export function useMediaPlayer() {
  const ctx = useContext(MediaPlayerContext);
  if (!ctx) throw new Error('useMediaPlayer must be used within a MediaPlayerProvider');
  return ctx;
}

export function MediaPlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>(EMPTY_STATE);

  const [inlineVideoHostActive, setInlineVideoHostActive] = useState(false);

  const soundRef = useRef<SoundLike | null>(null);
  const videoRef = useRef<Video>(null);

  const currentItem = state.queue.length ? state.queue[state.currentIndex] ?? null : null;

  const stateRef = useRef<PlayerState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const currentItemRef = useRef<MediaItem | null>(currentItem);
  useEffect(() => {
    currentItemRef.current = currentItem;
  }, [currentItem]);

  const applyPlaybackConfigToCurrent = useCallback(async () => {
    const s = stateRef.current;
    const item = currentItemRef.current;
    if (!item) return;

    if (item.mediaType === 'audio') {
      const snd = soundRef.current;
      if (!snd) return;
      try {
        await snd.setRateAsync(s.playbackRate, true);
      } catch {
        // ignore
      }
      try {
        await snd.setVolumeAsync(s.volume);
      } catch {
        // ignore
      }
      try {
        await snd.setProgressUpdateIntervalAsync(500);
      } catch {
        // ignore
      }
      return;
    }

    const v = videoRef.current;
    if (!v) return;
    try {
      await v.setStatusAsync({ rate: s.playbackRate, shouldCorrectPitch: true });
    } catch {
      // ignore
    }
    try {
      await v.setStatusAsync({ volume: s.volume });
    } catch {
      // ignore
    }
  }, []);

  const shuffleQueueKeepCurrent = useCallback((queue: MediaItem[], currentIndex: number) => {
    if (queue.length <= 1) return { queue, currentIndex };
    const current = queue[currentIndex];
    const rest = queue.filter((_, idx) => idx !== currentIndex);
    for (let i = rest.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = rest[i];
      rest[i] = rest[j];
      rest[j] = tmp;
    }
    return { queue: [current, ...rest], currentIndex: 0 };
  }, []);

  const handleDidJustFinish = useCallback(async () => {
    const s = stateRef.current;
    const item = currentItemRef.current;
    if (!item) return;

    if (s.repeatMode === 'one') {
      try {
        await (item.mediaType === 'audio'
          ? soundRef.current?.setPositionAsync(0)
          : videoRef.current?.setPositionAsync(0));
      } catch {
        // ignore
      }
      try {
        await (item.mediaType === 'audio'
          ? soundRef.current?.playAsync()
          : videoRef.current?.playAsync());
      } catch {
        // ignore
      }
      return;
    }

    const isLast = s.currentIndex >= Math.max(0, s.queue.length - 1);
    if (isLast && s.repeatMode === 'off') {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        positionMs: prev.durationMs,
      }));
      return;
    }

    const nextIndex = s.queue.length
      ? (s.currentIndex + 1) % s.queue.length
      : 0;
    // Use the same skip logic, but avoid capturing stale state by delegating.
    await skipToIndex(nextIndex);
  }, []);

  const updateProgressFromStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setState((s) => ({
      ...s,
      isPlaying: Boolean(status.isPlaying),
      positionMs: Math.max(0, Math.round(status.positionMillis ?? 0)),
      durationMs: Math.max(0, Math.round(status.durationMillis ?? 0)),
    }));

    // Auto-next / repeat handling
    if ((status as any).didJustFinish) {
      handleDidJustFinish().catch(() => undefined);
    }
  }, [handleDidJustFinish]);

  const onVideoPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      updateProgressFromStatus(status);
    },
    [updateProgressFromStatus]
  );

  const unloadAudio = useCallback(async () => {
    const snd = soundRef.current;
    if (!snd) return;
    soundRef.current = null;
    try {
      await snd.unloadAsync();
    } catch {
      // ignore
    }
  }, []);

  const stopVideo = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      await v.stopAsync();
    } catch {
      // ignore
    }
  }, []);

  const loadAndPlayAudio = useCallback(
    async (item: MediaItem) => {
      await stopVideo();
      await unloadAudio();

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: item.mediaUrl },
        { shouldPlay: true },
        updateProgressFromStatus
      );

      soundRef.current = sound;

      try {
        await sound.setProgressUpdateIntervalAsync(500);
      } catch {
        // ignore
      }
      try {
        await sound.setRateAsync(stateRef.current.playbackRate, true);
      } catch {
        // ignore
      }
      try {
        await sound.setVolumeAsync(stateRef.current.volume);
      } catch {
        // ignore
      }

      setState((s) => ({
        ...s,
        isPlaying: true,
      }));
    },
    [stopVideo, unloadAudio, updateProgressFromStatus]
  );

  const prepareVideo = useCallback(async () => {
    await unloadAudio();
  }, [unloadAudio]);

  const playQueue = useCallback(
    async (queue: MediaItem[], index: number) => {
      const safeIndex = Math.min(Math.max(0, index), Math.max(0, queue.length - 1));
      const nextState = stateRef.current.isShuffle
        ? shuffleQueueKeepCurrent(queue, safeIndex)
        : { queue, currentIndex: safeIndex };

      const item = nextState.queue[nextState.currentIndex];
      if (!item) return;

      setState((s) => ({
        ...s,
        queue: nextState.queue,
        currentIndex: nextState.currentIndex,
        positionMs: 0,
        durationMs: 0,
        isExpanded: false,
      }));

      if (item.mediaType === 'audio') {
        await loadAndPlayAudio(item);
        return;
      }

      await prepareVideo();
      setState((s) => ({ ...s, isPlaying: true }));
      // actual play is handled by Video component when it renders with shouldPlay
    },
    [loadAndPlayAudio, prepareVideo]
  );

  const togglePlayPause = useCallback(async () => {
    const item = currentItem;
    if (!item) return;

    if (item.mediaType === 'audio') {
      const snd = soundRef.current;
      if (!snd) return;
      const status = await snd.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await snd.pauseAsync();
        setState((s) => ({ ...s, isPlaying: false }));
      } else {
        await snd.playAsync();
        setState((s) => ({ ...s, isPlaying: true }));
      }
      return;
    }

    const v = videoRef.current;
    if (!v) return;
    const status = await v.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await v.pauseAsync();
      setState((s) => ({ ...s, isPlaying: false }));
    } else {
      await v.playAsync();
      setState((s) => ({ ...s, isPlaying: true }));
    }
  }, [currentItem]);

  const seekTo = useCallback(
    async (positionMs: number) => {
      const item = currentItem;
      if (!item) return;

      const safe = Math.max(0, Math.round(positionMs));

      if (item.mediaType === 'audio') {
        const snd = soundRef.current;
        if (!snd) return;
        await snd.setPositionAsync(safe);
        return;
      }

      const v = videoRef.current;
      if (!v) return;
      await v.setPositionAsync(safe);
    },
    [currentItem]
  );

  const skipToIndex = useCallback(
    async (nextIndex: number) => {
      const s = stateRef.current;
      const safeIndex = Math.min(Math.max(0, nextIndex), Math.max(0, s.queue.length - 1));

      setState((prev) => ({
        ...prev,
        currentIndex: safeIndex,
        positionMs: 0,
        durationMs: 0,
        isExpanded: false,
        isPlaying: true,
      }));

      const item = s.queue[safeIndex];
      if (!item) return;

      if (item.mediaType === 'audio') {
        await loadAndPlayAudio(item);
      } else {
        await prepareVideo();
        await applyPlaybackConfigToCurrent();
      }
    },
    [applyPlaybackConfigToCurrent, loadAndPlayAudio, prepareVideo]
  );

  const skipNext = useCallback(async () => {
    const s = stateRef.current;
    if (!s.queue.length) return;
    const isLast = s.currentIndex >= Math.max(0, s.queue.length - 1);
    if (isLast && s.repeatMode === 'off') {
      return;
    }
    const next = (s.currentIndex + 1) % s.queue.length;
    await skipToIndex(next);
  }, [skipToIndex]);

  const skipPrev = useCallback(async () => {
    const s = stateRef.current;
    if (!s.queue.length) return;
    const prev = (s.currentIndex - 1 + s.queue.length) % s.queue.length;
    await skipToIndex(prev);
  }, [skipToIndex]);

  const setShuffle = useCallback(
    (enabled: boolean) => {
      setState((s) => {
        if (s.isShuffle === enabled) return s;
        if (!enabled) return { ...s, isShuffle: false };
        const shuffled = shuffleQueueKeepCurrent(s.queue, s.currentIndex);
        return {
          ...s,
          isShuffle: true,
          queue: shuffled.queue,
          currentIndex: shuffled.currentIndex,
        };
      });
    },
    [shuffleQueueKeepCurrent]
  );

  const toggleShuffle = useCallback(() => {
    setShuffle(!stateRef.current.isShuffle);
  }, [setShuffle]);

  const setRepeatMode = useCallback((mode: PlayerState['repeatMode']) => {
    setState((s) => ({ ...s, repeatMode: mode }));
  }, []);

  const cycleRepeatMode = useCallback(() => {
    const current = stateRef.current.repeatMode;
    const next = current === 'off' ? 'all' : current === 'all' ? 'one' : 'off';
    setRepeatMode(next);
  }, [setRepeatMode]);

  const setPlaybackRate = useCallback(async (rate: number) => {
    const safe = Math.max(0.5, Math.min(2, rate));
    setState((s) => ({ ...s, playbackRate: safe }));

    const item = currentItemRef.current;
    if (!item) return;
    try {
      if (item.mediaType === 'audio') {
        await soundRef.current?.setRateAsync(safe, true);
      } else {
        await videoRef.current?.setStatusAsync({ rate: safe, shouldCorrectPitch: true });
      }
    } catch {
      // ignore
    }
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    const safe = Math.max(0, Math.min(1, volume));
    setState((s) => ({ ...s, volume: safe }));

    const item = currentItemRef.current;
    if (!item) return;
    try {
      if (item.mediaType === 'audio') {
        await soundRef.current?.setVolumeAsync(safe);
      } else {
        await videoRef.current?.setStatusAsync({ volume: safe });
      }
    } catch {
      // ignore
    }
  }, []);

  const close = useCallback(async () => {
    await stopVideo();
    await unloadAudio();
    setState(EMPTY_STATE);
  }, [stopVideo, unloadAudio]);

  const setExpanded = useCallback((expanded: boolean) => {
    setState((s) => ({ ...s, isExpanded: expanded }));
  }, []);

  useEffect(() => {
    return () => {
      (async () => {
        await stopVideo();
        await unloadAudio();
      })();
    };
  }, [stopVideo, unloadAudio]);

  const value = useMemo<MediaPlayerContextValue>(
    () => ({
      state,
      currentItem,
      playQueue,
      togglePlayPause,
      seekTo,
      skipNext,
      skipPrev,
      setShuffle,
      toggleShuffle,
      setRepeatMode,
      cycleRepeatMode,
      setPlaybackRate,
      setVolume,
      close,
      setExpanded,

      inlineVideoHostActive,
      setInlineVideoHostActive,
      onVideoPlaybackStatusUpdate,
      videoRef,
    }),
    [
      close,
      currentItem,
      cycleRepeatMode,
      inlineVideoHostActive,
      onVideoPlaybackStatusUpdate,
      playQueue,
      seekTo,
      setPlaybackRate,
      setRepeatMode,
      setExpanded,
      setShuffle,
      skipNext,
      skipPrev,
      state,
      setVolume,
      setInlineVideoHostActive,
      toggleShuffle,
      togglePlayPause,
    ]
  );

  return (
    <MediaPlayerContext.Provider value={value}>
      {children}
      <MediaPlayerOverlay bottomSafeAreaPadding={Platform.OS === 'web' ? 12 : 0} />
    </MediaPlayerContext.Provider>
  );
}
