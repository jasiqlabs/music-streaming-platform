import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const OfflineScreen: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Cloud with WiFi signal illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.cloudContainer}>
            <WifiOff size={80} color="#6B7280" />
          </View>
          <View style={styles.wifiSignal}>
            <View style={[styles.signalBar, { height: 20, opacity: 0.3 }]} />
            <View style={[styles.signalBar, { height: 35, opacity: 0.5 }]} />
            <View style={[styles.signalBar, { height: 50, opacity: 0.7 }]} />
            <View style={[styles.signalBar, { height: 65, opacity: 0.9 }]} />
          </View>
        </View>

        {/* Offline message */}
        <Text style={styles.title}>You're offline</Text>
        <Text style={styles.subtitle}>
          You are currently offline. Please check your connection.
        </Text>

        {/* Retry button */}
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <RefreshCw size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
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
    backgroundColor: '#0F0F0F',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  illustrationContainer: {
    marginBottom: 40,
    alignItems: 'center',
    position: 'relative',
  },
  cloudContainer: {
    backgroundColor: '#1F1F1F',
    borderRadius: 100,
    padding: 30,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  wifiSignal: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 65,
    gap: 4,
  },
  signalBar: {
    width: 6,
    backgroundColor: '#6B7280',
    borderRadius: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OfflineScreen;
