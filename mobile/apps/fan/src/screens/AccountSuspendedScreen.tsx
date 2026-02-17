import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Lock, LogOut, ShieldX, Mail } from 'lucide-react-native';

import { useAuth } from '../store/authStore';

const { width, height } = Dimensions.get('window');

interface AccountSuspendedScreenProps {
  onContactSupport: () => void;
  onLogout?: () => void;
}

const AccountSuspendedScreen: React.FC<AccountSuspendedScreenProps> = ({
  onContactSupport,
  onLogout,
}) => {
  const { logout } = useAuth();

  const performLogout = async () => {
    console.log('User logged out, redirecting to Login...');
    await logout();
    await onLogout?.();
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out? You can log back in after your account is reactivated.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: performLogout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={100} style={StyleSheet.absoluteFill} tint="dark" />
      
      <View style={styles.content}>
        {/* Lock Icon with Shield */}
        <View style={styles.iconContainer}>
          <View style={styles.lockCircle}>
            <Lock size={48} color="#DC2626" />
          </View>
          <View style={styles.shieldBadge}>
            <ShieldX size={16} color="#DC2626" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Account Suspended</Text>
        
        {/* Message */}
        <Text style={styles.message}>
          Your account has been suspended due to a policy violation.
        </Text>
        <Text style={styles.subMessage}>
          Please contact our support team to resolve this issue.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.supportButton} 
            onPress={onContactSupport}
            activeOpacity={0.8}
          >
            <Mail size={20} color="#FFFFFF" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={20} color="#9CA3AF" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Warning Notice */}
        <View style={styles.warningNotice}>
          <Text style={styles.warningText}>
            ⚠️ All access to premium content has been restricted
          </Text>
        </View>

        {/* Additional Information */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoText}>
            • Contact support to understand the suspension reason{'\n'}
            • Follow the provided steps to resolve the issue{'\n'}
            • Your account will be reactivated once resolved{'\n'}
            • You can log out and log back in after reactivation
          </Text>
        </View>

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>Guard: Account Suspension</Text>
            <Text style={styles.debugText}>Status: Locked - No navigation allowed</Text>
          </View>
        )}
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
    zIndex: 10001, // Higher than subscription expiry
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
  lockCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 2,
    borderColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1F1F1F',
    borderWidth: 2,
    borderColor: '#DC2626',
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
  subMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  supportButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  logoutButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  warningNotice: {
    width: '100%',
    padding: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderRadius: 12,
    marginBottom: 24,
  },
  warningText: {
    fontSize: 14,
    color: '#FCA5A5',
    textAlign: 'center',
    fontWeight: '500',
  },
  debugInfo: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },
  infoSection: {
    width: '100%',
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default AccountSuspendedScreen;
