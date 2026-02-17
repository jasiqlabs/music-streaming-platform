import 'react-native-gesture-handler';

import React from 'react';
import AppNavigator from './apps/fan/src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './apps/fan/src/store/authStore';
import { ConnectivityProvider } from './apps/fan/src/providers/ConnectivityProvider';
import AccountSuspendedScreen from './apps/fan/src/screens/AccountSuspendedScreen';
import LoginScreen from './apps/fan/src/screens/LoginScreen';
import { Linking } from 'react-native';

function AppContent() {
  const { token, user, isRestoring, logout } = useAuth();

  const handleContactSupport = async () => {
    const supportEmail = 'support@musicapp.com';
    const subject = encodeURIComponent('Account Suspension Appeal');
    const body = encodeURIComponent(
      'Dear Support Team,\n\nI would like to appeal my account suspension. Please provide details about the reason for suspension and steps to resolve this issue.\n\nThank you.'
    );
    const mailtoUrl = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    await Linking.openURL(mailtoUrl);
  };

  const handleLogout = async () => {
    console.log('User logged out, redirecting to Login...');
    await logout();
  };

  if (isRestoring) {
    return null;
  }

  if (!token) {
    return <LoginScreen />;
  }

  if (user?.status === 'SUSPENDED') {
    return (
      <AccountSuspendedScreen onContactSupport={handleContactSupport} onLogout={handleLogout} />
    );
  }

  return (
    <ConnectivityProvider>
      <AppNavigator />
    </ConnectivityProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
