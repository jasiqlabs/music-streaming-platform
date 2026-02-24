import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';

import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, isLoggingIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const canSubmit = useMemo(
    () => email.trim() && password && !isLoggingIn,
    [email, password, isLoggingIn]
  );

  const onSubmit = async () => {
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;
      const message =
        typeof serverMessage === 'string'
          ? serverMessage
          : status === 403
            ? 'Access forbidden.'
            : status === 401
              ? 'Invalid credentials.'
              : err?.message || 'Login failed';
      Alert.alert('Login Error', message);
    }
  };

  return (
    <ImageBackground
      source={require('../logo.jpg')}
      style={styles.bg}
      blurRadius={30}
    >
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding' })}
        style={styles.overlay}
      >
        <Image
          source={require('../logo.jpg')}
          style={styles.logo}
        />

        <View style={styles.card}>
          <Text style={styles.title}>Sign In</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#aaa"
              style={styles.passwordInput}
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setIsPasswordVisible((v) => !v)}
              hitSlop={10}
              style={styles.eyeButton}
            >
              {isPasswordVisible ? (
                <EyeOff color="#ddd" size={18} />
              ) : (
                <Eye color="#ddd" size={18} />
              )}
            </Pressable>
          </View>

          <Pressable onPress={onSubmit} disabled={!canSubmit}>
            <LinearGradient
              colors={['#ff7a18', '#ff3d00']}
              style={styles.button}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={styles.link}>Create account</Text>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 30,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    color: '#fff',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    paddingRight: 44,
    color: '#fff',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    color: '#bbb',
    marginTop: 16,
    textAlign: 'center',
  },
});
