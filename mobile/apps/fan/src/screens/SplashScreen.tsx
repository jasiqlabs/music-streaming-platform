
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View, Dimensions } from 'react-native';
import { Shadow } from 'react-native-shadow-2';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure this is installed

import { JWT_STORAGE_KEY } from '../services/api';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem(JWT_STORAGE_KEY);
        navigation.reset({
          index: 0,
          routes: [{ name: token ? 'MainTabs' : 'Login' }],
        });
      } catch {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Cinematic Background Gradient */}
      <LinearGradient
        colors={['#1a1a1a', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      {/* Main Logo with High-End Glow */}
      <Shadow 
        distance={40} 
        startColor="rgba(255, 69, 0, 0.25)" // Orange glow like the image
        offset={[0, 0]}
      >
        <View style={styles.logoWrapper}>
           <Image
            source={require('../logo.jpg')}
            style={styles.logo}
            resizeMode="cover"
          />
          {/* Internal gradient for the "Glassy" feel */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={styles.innerGradient}
          />
        </View>
      </Shadow>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 30, // Rounded corners like the music icon
    overflow: 'hidden',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  innerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
});
