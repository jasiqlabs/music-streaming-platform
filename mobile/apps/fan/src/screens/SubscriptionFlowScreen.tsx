import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BadgeCheck, Check, Pause, Play } from 'lucide-react-native';
import ErrorBoundary from '../ui/ErrorBoundary';

type PaymentStep = 'OFFER' | 'PROCESSING' | 'SUCCESS';

type RouteParams = {
  artistId?: string;
  artistName?: string;
  contentId?: string;
  artwork?: string;
};

export default function SubscriptionFlowScreen({ navigation, route }: any) {
  const tabBarHeight = useBottomTabBarHeight();
  const params: RouteParams = route?.params ?? {};

  const artistId = params.artistId ?? 'luna-ray';
  const artistName = params.artistName ?? 'Luna Ray';
  const contentId = params.contentId;

  const bgUri =
    params.artwork ??
    'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?auto=format&fit=crop&w=1400&q=80';

  const [paymentStep, setPaymentStep] = useState<PaymentStep>('OFFER');

  const [miniIsPlaying, setMiniIsPlaying] = useState(false);
  const miniProgress = useMemo(() => 0.4, []);

  useEffect(() => {
    console.log('[SubscriptionFlow] paymentStep:', paymentStep);
  }, [paymentStep]);

  useEffect(() => {
    if (paymentStep !== 'PROCESSING') return;
    console.log('[SubscriptionFlow] Moving to SUCCESS (simulated webhook)');
    const t = setTimeout(() => {
      setPaymentStep('SUCCESS');
    }, 3000);
    return () => clearTimeout(t);
  }, [paymentStep]);

  const onSubscribePress = () => {
    console.log('[SubscriptionFlow] Moving to PROCESSING');
    setPaymentStep('PROCESSING');
  };

  const onStartListening = () => {
    navigation.navigate('ArtistScreen', { artistId, unlocked: true, contentId });
  };

  return (
    <ErrorBoundary label="Payments: Subscription Flow">
      <SafeAreaView style={styles.container}>
        <ImageBackground source={{ uri: bgUri }} style={styles.bg} resizeMode="cover">
          <LinearGradient
            colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.70)', 'rgba(0,0,0,0.92)']}
            style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
            pointerEvents="none"
          />

          {paymentStep === 'OFFER' ? (
            <View style={styles.offerWrap} pointerEvents="auto">
              <View style={styles.artistRow}>
                <Text style={styles.artistName}>{artistName}</Text>
                <View style={styles.verifiedWrap}>
                  <BadgeCheck color="#4AA3FF" fill="#4AA3FF" size={18} />
                </View>
              </View>

              <BlurView intensity={22} tint="dark" style={styles.glassCard}>
                <View style={styles.priceWrap}>
                  <Text style={styles.priceText}>$4.99</Text>
                  <Text style={styles.priceUnit}>/month</Text>
                </View>

                <View style={styles.benefitsWrap}>
                  <View style={styles.benefitRow}>
                    <Text style={styles.checkMark}>✓</Text>
                    <Text style={styles.benefitText}>Early access to new music</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <Text style={styles.checkMark}>✓</Text>
                    <Text style={styles.benefitText}>Support {artistName} directly</Text>
                  </View>
                </View>

                <Pressable style={styles.primaryBtn} onPress={onSubscribePress}>
                  <LinearGradient
                    colors={['rgba(255,122,24,0.45)', 'rgba(255,122,24,0.20)']}
                    style={styles.primaryBtnInner}
                  >
                    <Text style={styles.primaryBtnText}>Subscribe</Text>
                  </LinearGradient>
                </Pressable>
              </BlurView>
            </View>
          ) : null}

          {paymentStep === 'PROCESSING' ? (
            <View style={styles.processingWrap} pointerEvents="auto">
              <View style={styles.spinnerWrap}>
                <ActivityIndicator size="large" color="#FF7A18" />
              </View>
              <Text style={styles.processingText}>Payment received, confirming...</Text>
            </View>
          ) : null}

          {paymentStep === 'SUCCESS' ? (
            <View style={styles.successWrap} pointerEvents="auto">
              <View style={styles.successIconWrap}>
                <Check color="#FF7A18" size={30} strokeWidth={3} />
              </View>
              <Text style={styles.successText}>You now have early access</Text>

              <Pressable style={styles.primaryBtnWide} onPress={onStartListening}>
                <LinearGradient
                  colors={['rgba(255,122,24,0.45)', 'rgba(255,122,24,0.20)']}
                  style={styles.primaryBtnInner}
                >
                  <Text style={styles.primaryBtnText}>Start Listening</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}

          {paymentStep !== 'PROCESSING' ? (
            <View style={[styles.miniPlayer, { bottom: tabBarHeight + 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniTitle} numberOfLines={1}>
                  Secret Melody
                </Text>
                <Text style={styles.miniSub} numberOfLines={1}>
                  {artistName}
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${miniProgress * 100}%` }]} />
                </View>
              </View>

              <Pressable style={styles.miniControl} onPress={() => setMiniIsPlaying((v) => !v)}>
                {miniIsPlaying ? (
                  <Pause color="#fff" size={22} />
                ) : (
                  <Play color="#fff" size={22} />
                )}
              </Pressable>
            </View>
          ) : null}
        </ImageBackground>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bg: {
    flex: 1,
  },

  offerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  artistName: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  verifiedWrap: {
    marginLeft: 10,
    marginTop: 4,
  },

  glassCard: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  priceText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
  },
  priceUnit: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 2,
    marginBottom: 6,
  },

  benefitsWrap: {
    paddingTop: 16,
    paddingBottom: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkMark: {
    color: '#FF7A18',
    fontSize: 18,
    fontWeight: '900',
    width: 24,
  },
  benefitText: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    fontWeight: '600',
  },

  primaryBtn: {
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,122,24,0.35)',
    marginTop: 6,
  },
  primaryBtnWide: {
    width: '100%',
    maxWidth: 320,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,122,24,0.35)',
    marginTop: 18,
  },
  primaryBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryBtnText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  processingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  spinnerWrap: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 18,
  },
  processingText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '700',
  },

  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,122,24,0.75)',
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginBottom: 18,
  },
  successText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '800',
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
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  miniTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  miniSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  progressTrack: {
    marginTop: 8,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  miniControl: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
