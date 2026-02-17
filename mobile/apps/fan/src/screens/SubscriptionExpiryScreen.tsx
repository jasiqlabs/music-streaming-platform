import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, Crown } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SubscriptionExpiryScreenProps {
  artistName: string;
  onRenewSubscription: () => void;
}

const SubscriptionExpiryScreen: React.FC<SubscriptionExpiryScreenProps> = ({
  artistName,
  onRenewSubscription,
}) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={100} style={StyleSheet.absoluteFill} tint="dark" />
      
      <View style={styles.content}>
        {/* Warning Icon with Crown */}
        <View style={styles.iconContainer}>
          <View style={styles.warningCircle}>
            <AlertTriangle size={48} color="#FF6A00" />
          </View>
          <View style={styles.crownBadge}>
            <Crown size={16} color="#FFD700" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Subscription Expired</Text>
        
        {/* Message */}
        <Text style={styles.message}>
          Your subscription for <Text style={styles.artistName}>{artistName}</Text> has expired.
        </Text>
        <Text style={styles.subMessage}>
          Renew to regain access to early releases and exclusive content.
        </Text>

        {/* Renew Button */}
        <TouchableOpacity 
          style={styles.renewButton} 
          onPress={onRenewSubscription}
          activeOpacity={0.8}
        >
          <Crown size={20} color="#FFD700" />
          <Text style={styles.renewButtonText}>Renew Subscription</Text>
        </TouchableOpacity>

        {/* Debug Info */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>Guard: Subscription Expiry</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: width * 0.9,
  },
  iconContainer: {
    marginBottom: 32,
    position: 'relative',
  },
  warningCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 106, 0, 0.1)',
    borderWidth: 2,
    borderColor: '#FF6A00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1F1F1F',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#E5E5E5',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
  },
  artistName: {
    color: '#FF6A00',
    fontWeight: '700',
  },
  subMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6A00',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  renewButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  debugInfo: {
    marginTop: 24,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },
});

export default SubscriptionExpiryScreen;
