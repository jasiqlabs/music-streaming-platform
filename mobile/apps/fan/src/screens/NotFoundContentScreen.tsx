import React from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

type Props = {
  onGoBack?: () => void;
};

export default function NotFoundContentScreen({ onGoBack }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?auto=format&fit=crop&w=1200&q=80',
        }}
        style={styles.bg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.72)', 'rgba(0,0,0,0.90)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.centerWrap}>
          <View style={styles.iconWrap}>
            <X color="#D7B7A0" size={34} strokeWidth={2.5} />
          </View>

          <Text style={styles.title}>This content is no longer available</Text>

          <Pressable style={styles.btn} onPress={onGoBack}>
            <LinearGradient
              colors={['rgba(255,122,24,0.22)', 'rgba(255,122,24,0.12)']}
              style={styles.btnInner}
            >
              <Text style={styles.btnText}>Go back</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ImageBackground>
    </SafeAreaView>
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
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,122,24,0.55)',
    backgroundColor: 'rgba(0,0,0,0.10)',
    marginBottom: 22,
  },
  title: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },
  btn: {
    width: '100%',
    maxWidth: 320,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,122,24,0.35)',
  },
  btnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnText: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    fontWeight: '700',
  },
});
