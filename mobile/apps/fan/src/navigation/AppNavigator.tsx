import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import LoginScreen from '../screens/LoginScreen';
import SplashScreen from '../screens/SplashScreen';
import MainTabsNavigator from './MainTabsNavigator';
import { useAuth } from '../store/authStore';
import { navigationRef } from './rootNavigation';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, bootstrapAuth } = useAuth();
  const [isSplashVisible, setIsSplashVisible] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const start = Date.now();

    (async () => {
      try {
        await bootstrapAuth();
      } finally {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, 3000 - elapsed);
        setTimeout(() => {
          if (mounted) setIsSplashVisible(false);
        }, remaining);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [bootstrapAuth]);

  if (isSplashVisible) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator id="fan-root">
        {isAuthenticated ? (
          <Stack.Screen
            name="MainTabs"
            component={MainTabsNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
