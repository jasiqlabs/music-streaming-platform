import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BadgeCheck, Check, CreditCard, Pause, Play } from 'lucide-react-native';
import ErrorBoundary from '../ui/ErrorBoundary';
import { apiV1 } from '../services/api';

type PaymentStep = 'OFFER' | 'PROCESSING' | 'SUCCESS';

type RouteParams = {
  artistId?: string;
  artistName?: string;
  contentId?: string;
  artwork?: string;
};

function formatRenewDate(value: unknown): string {
  if (!value) return '';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

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

  const [mockModalVisible, setMockModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Payment received. Confirming…');

  const [miniIsPlaying, setMiniIsPlaying] = useState(false);
  const miniProgress = useMemo(() => 0.4, []);

  useEffect(() => {
    console.log('[SubscriptionFlow] paymentStep:', paymentStep);
  }, [paymentStep]);

  useEffect(() => {
    if (!isVerifyingPayment) return;

    setProcessingMessage('Payment received. Confirming…');

    const t = setTimeout(() => {
      setProcessingMessage('We’re still confirming. Check again in a minute.');
    }, 5000);

    return () => clearTimeout(t);
  }, [isVerifyingPayment]);

  const createMockOrder = async () => {
    if (isCreatingOrder || isVerifyingPayment) return;

    try {
      setIsCreatingOrder(true);

      const amountPaise = 49900;
      const res = await apiV1.post('/subscriptions/mock-order', {
        amount: amountPaise,
        artistName,
        paymentMethod: selectedPaymentMethod,
      });

      const nextOrderId = (res.data?.order?.id ?? '').toString();
      if (!nextOrderId) {
        throw new Error('Mock order creation succeeded but order id was missing');
      }

      setOrderId(nextOrderId);
      setMockModalVisible(true);
    } catch (err: any) {
      Alert.alert('Payment Error', err?.message || 'Failed to create mock order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const verifyMockPayment = async () => {
    if (!orderId) {
      Alert.alert('Payment Error', 'Missing mock order id');
      return;
    }

    const artistIdNumber = Number(artistId);
    if (!Number.isFinite(artistIdNumber) || artistIdNumber <= 0) {
      Alert.alert('Payment Error', 'Invalid artist id for verification');
      return;
    }

    try {
      setMockModalVisible(false);
      setPaymentStep('PROCESSING');
      setIsVerifyingPayment(true);

      const res = await apiV1.post('/subscriptions/mock-verify', {
        razorpay_order_id: orderId,
        artist_id: artistIdNumber,
        paymentMethod: selectedPaymentMethod,
      });

      const renewDate = formatRenewDate(res.data?.subscription?.end_date);

      const parentNav = typeof navigation?.getParent === 'function' ? navigation.getParent() : null;
      const targetArtistId = String(artistIdNumber);

      if (parentNav?.navigate) {
        parentNav.navigate('LibraryTab', {
          screen: 'SubscriptionDetail',
          params: {
            artistId: targetArtistId,
            status: 'Active',
            renewDate,
          },
        });
      } else {
        navigation.navigate('SubscriptionDetail', {
          artistId: targetArtistId,
          status: 'Active',
          renewDate,
        });
      }

      setPaymentStep('SUCCESS');
    } catch (err: any) {
      setPaymentStep('OFFER');
      Alert.alert('Payment Failed', err?.message || 'Mock payment verification failed');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const onStartListening = () => {
    navigation.navigate('Artist', { artistId, unlocked: true, contentId });
  };

  return (
    <ErrorBoundary label="Payments: Subscription Flow">
      <SafeAreaView style={styles.container}>
        <ImageBackground source={{ uri: bgUri }} style={styles.bg} resizeMode="cover">
          <LinearGradient
            colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.70)', 'rgba(0,0,0,0.92)']}
            style={[StyleSheet.absoluteFill, { zIndex: 0, pointerEvents: 'none' }]}
          />

          {paymentStep === 'OFFER' ? (
            <View style={styles.offerWrap}>
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

                <Pressable style={styles.primaryBtn} onPress={createMockOrder} disabled={isCreatingOrder}>
                  <LinearGradient
                    colors={['rgba(255,122,24,0.45)', 'rgba(255,122,24,0.20)']}
                    style={styles.primaryBtnInner}
                  >
                    <Text style={styles.primaryBtnText}>
                      {isCreatingOrder ? 'Creating Order...' : 'Pay Now'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </BlurView>
            </View>
          ) : null}

          <Modal
            visible={mockModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => {
              if (isVerifyingPayment) return;
              setMockModalVisible(false);
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Select Payment Method</Text>
                <Text style={styles.modalSubtitle} numberOfLines={2}>
                  Order: {orderId ?? '-'}
                </Text>

                <View style={styles.paymentMethodsWrap}>
                  <Pressable
                    style={[
                      styles.paymentMethod,
                      selectedPaymentMethod === 'card' && styles.paymentMethodSelected
                    ]}
                    onPress={() => setSelectedPaymentMethod('card')}
                  >
                    <CreditCard 
                      color={selectedPaymentMethod === 'card' ? '#FF7A18' : '#fff'} 
                      size={20} 
                    />
                    <Text style={[
                      styles.paymentMethodText,
                      selectedPaymentMethod === 'card' && styles.paymentMethodTextSelected
                    ]}>
                      Card
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.paymentMethod,
                      selectedPaymentMethod === 'upi' && styles.paymentMethodSelected
                    ]}
                    onPress={() => setSelectedPaymentMethod('upi')}
                  >
                    <View style={styles.upiIcon}>
                      <Text style={styles.upiIconText}>UPI</Text>
                    </View>
                    <Text style={[
                      styles.paymentMethodText,
                      selectedPaymentMethod === 'upi' && styles.paymentMethodTextSelected
                    ]}>
                      UPI
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.paymentMethod,
                      selectedPaymentMethod === 'netbanking' && styles.paymentMethodSelected
                    ]}
                    onPress={() => setSelectedPaymentMethod('netbanking')}
                  >
                    <View style={styles.netbankingIcon}>
                      <Text style={styles.netbankingIconText}>NB</Text>
                    </View>
                    <Text style={[
                      styles.paymentMethodText,
                      selectedPaymentMethod === 'netbanking' && styles.paymentMethodTextSelected
                    ]}>
                      Netbanking
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  style={[styles.modalBtn, styles.modalBtnSuccess]}
                  onPress={verifyMockPayment}
                  disabled={isVerifyingPayment}
                >
                  <Text style={styles.modalBtnText}>
                    Pay $4.99 with {selectedPaymentMethod === 'card' ? 'Card' : selectedPaymentMethod === 'upi' ? 'UPI' : 'Netbanking'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.modalBtn, styles.modalBtnNeutral]}
                  onPress={() => {
                    if (isVerifyingPayment) return;
                    setMockModalVisible(false);
                  }}
                  disabled={isVerifyingPayment}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          {paymentStep === 'PROCESSING' ? (
            <View style={styles.processingWrap}>
              <View style={styles.spinnerWrap}>
                <ActivityIndicator size="large" color="#FF7A18" />
              </View>
              <Text style={styles.processingText}>{processingMessage}</Text>
            </View>
          ) : null}

          {paymentStep === 'SUCCESS' ? (
            <View style={styles.successWrap}>
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

  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(0,0,0,0.70)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    padding: 18,
    backgroundColor: 'rgba(18,18,18,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 14,
  },
  modalBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 10,
  },
  modalBtnSuccess: {
    backgroundColor: 'rgba(0,200,120,0.14)',
    borderColor: 'rgba(0,200,120,0.35)',
  },
  modalBtnFailure: {
    backgroundColor: 'rgba(255,80,80,0.14)',
    borderColor: 'rgba(255,80,80,0.35)',
  },
  modalBtnNeutral: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modalBtnText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Payment Method Styles
  paymentMethodsWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  paymentMethod: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: 4,
  },
  paymentMethodSelected: {
    borderColor: '#FF7A18',
    backgroundColor: 'rgba(255,122,24,0.1)',
  },
  paymentMethodText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  paymentMethodTextSelected: {
    color: '#FF7A18',
  },
  upiIcon: {
    width: 32,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiIconText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  netbankingIcon: {
    width: 32,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  netbankingIconText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
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
