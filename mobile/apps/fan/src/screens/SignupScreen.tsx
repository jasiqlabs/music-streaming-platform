import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, Eye, EyeOff } from 'lucide-react-native';

import type { RootStackParamList } from '../navigation/types';
import { apiV1 } from '../services/api';
import { useAuth } from '../store/authStore';
import { Colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type FavoriteGenre = 'Pop' | 'Hip-Hop' | 'Sufi' | 'Rock' | 'EDM' | 'Other';

const GENRES: FavoriteGenre[] = ['Pop', 'Hip-Hop', 'Sufi', 'Rock', 'EDM', 'Other'];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function SignupScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { width, height } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const webViewportStyle = Platform.OS === 'web' ? { width, height } : null;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState<FavoriteGenre | ''>('');

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const [isGenreOpen, setIsGenreOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const emailError = useMemo(() => {
    if (!email.trim()) return '';
    return isValidEmail(email) ? '' : 'Please enter a valid email address.';
  }, [email]);

  const passwordMismatchError = useMemo(() => {
    if (!confirmPassword) return '';
    return password === confirmPassword ? '' : "Passwords don't match.";
  }, [password, confirmPassword]);

  const canSubmit = useMemo(() => {
    return (
      fullName.trim() &&
      email.trim() &&
      phoneNumber.trim() &&
      username.trim() &&
      password &&
      confirmPassword &&
      dateOfBirth.trim() &&
      favoriteGenre &&
      !emailError &&
      !passwordMismatchError
    );
  }, [
    confirmPassword,
    dateOfBirth,
    email,
    emailError,
    favoriteGenre,
    fullName,
    password,
    passwordMismatchError,
    phoneNumber,
    username,
  ]);

  const onSubmit = async () => {
    if (isSubmitting) return;
    setSubmitAttempted(true);
    setSubmitError('');

    if (!canSubmit) {
      Alert.alert('Missing Information', 'Please fill all fields correctly before signing up.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    setIsSubmitting(true);
    try {
      await apiV1.post('/auth/register', {
        fullName: fullName.trim(),
        email: normalizedEmail,
        phoneNumber: phoneNumber.trim(),
        username: username.trim(),
        password,
        dateOfBirth: dateOfBirth.trim(),
        favoriteGenre,
        locationCity: locationCity.trim(),
      });

      await login(normalizedEmail, password);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message ?? err?.response?.data?.error;

      if (
        status === 400 &&
        typeof serverMessage === 'string' &&
        serverMessage.toLowerCase().includes('email already exists')
      ) {
        setSubmitError('This email is already registered. Please login.');
        navigation.navigate('Login', { prefillEmail: normalizedEmail });
        return;
      }

      const message =
        typeof serverMessage === 'string'
          ? serverMessage
          : status === 400
            ? 'Registration failed. Please check your details.'
            : err?.message || 'Registration failed.';
      setSubmitError(message);
      Alert.alert('Sign Up Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  return (
    <LinearGradient
      colors={Colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.bg, webViewportStyle]}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding' })} style={styles.overlay}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.content, isDesktop ? styles.contentDesktop : styles.contentMobile]}>
              <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
                <ArrowLeft color={Colors.textPrimary} size={22} />
                <Text style={styles.backText}>Back</Text>
              </Pressable>

              <BlurView intensity={25} tint="dark" style={[styles.cardBlur, isDesktop && styles.cardBlurDesktop]}>
                <View style={[styles.cardInner, isDesktop && styles.cardInnerDesktop]}>
                  <Text style={styles.title}>Create Account</Text>

                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputGlass}>
                    <TextInput
                      placeholder="Your full name"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                      value={fullName}
                      onChangeText={(t) => {
                        setFullName(t);
                        if (submitError) setSubmitError('');
                      }}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>

                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputGlass}>
                    <TextInput
                      placeholder="Email"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        if (submitError) setSubmitError('');
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                    />
                  </View>
                  {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputGlass}>
                    <TextInput
                      placeholder="Phone number"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                      value={phoneNumber}
                      onChangeText={(t) => {
                        setPhoneNumber(t);
                        if (submitError) setSubmitError('');
                      }}
                      keyboardType={Platform.select({ ios: 'number-pad', default: 'phone-pad' })}
                    />
                  </View>

                  <Text style={styles.label}>Username</Text>
                  <View style={styles.inputGlass}>
                    <TextInput
                      placeholder="Choose a username"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                      value={username}
                      onChangeText={(t) => {
                        setUsername(t);
                        if (submitError) setSubmitError('');
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.passwordInput}
                      secureTextEntry={!isPasswordVisible}
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        if (submitError) setSubmitError('');
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Pressable
                      onPress={() => setIsPasswordVisible((v) => !v)}
                      hitSlop={10}
                      style={styles.eyeButton}
                    >
                      {isPasswordVisible ? (
                        <EyeOff color={Colors.textPrimary} size={18} />
                      ) : (
                        <Eye color={Colors.textPrimary} size={18} />
                      )}
                    </Pressable>
                  </View>

                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      placeholder="Confirm password"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.passwordInput}
                      secureTextEntry={!isConfirmPasswordVisible}
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        if (submitError) setSubmitError('');
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Pressable
                      onPress={() => setIsConfirmPasswordVisible((v) => !v)}
                      hitSlop={10}
                      style={styles.eyeButton}
                    >
                      {isConfirmPasswordVisible ? (
                        <EyeOff color={Colors.textPrimary} size={18} />
                      ) : (
                        <Eye color={Colors.textPrimary} size={18} />
                      )}
                    </Pressable>
                  </View>
                  {!!passwordMismatchError && (
                    <Text style={styles.errorText}>{passwordMismatchError}</Text>
                  )}

                  <Text style={styles.label}>Date of Birth</Text>
                  <View style={styles.inputGlass}>
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                      value={dateOfBirth}
                      onChangeText={(t) => {
                        setDateOfBirth(t);
                        if (submitError) setSubmitError('');
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <Text style={styles.label}>Favorite Genre</Text>
                  <Pressable
                    onPress={() => setIsGenreOpen((v) => !v)}
                    style={styles.selectInput}
                  >
                    <Text style={styles.selectText} numberOfLines={1}>
                      {favoriteGenre ? favoriteGenre : 'Select a genre'}
                    </Text>
                    <Text style={styles.selectCaret}>▾</Text>
                  </Pressable>

                  {submitAttempted && !favoriteGenre && (
                    <Text style={styles.errorText}>Please select a favorite genre.</Text>
                  )}

                  {isGenreOpen && (
                    <View style={styles.selectDropdown}>
                      {GENRES.map((g) => (
                        <Pressable
                          key={g}
                          onPress={() => {
                            setFavoriteGenre(g);
                            setIsGenreOpen(false);
                            if (submitError) setSubmitError('');
                          }}
                          style={styles.selectOption}
                        >
                          <Text style={styles.selectOptionText}>{g}</Text>
                          {favoriteGenre === g ? (
                            <Check color={Colors.textPrimary} size={18} />
                          ) : (
                            <View style={{ width: 18, height: 18 }} />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}

                  <Text style={styles.label}>Location (City)</Text>
                  <View style={styles.inputGlass}>
                    <TextInput
                      placeholder="Your city"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                      value={locationCity}
                      onChangeText={(t) => {
                        setLocationCity(t);
                        if (submitError) setSubmitError('');
                      }}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>

                  {!!submitError && <Text style={styles.errorText}>{submitError}</Text>}

                  <Pressable onPress={() => void onSubmit()}>
                    <View
                      style={[
                        styles.buttonWrap,
                        (!canSubmit || isSubmitting) && styles.buttonWrapDisabled,
                      ]}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#000" />
                      ) : (
                        <Text style={styles.btnText}>Sign Up</Text>
                      )}
                    </View>
                  </Pressable>
                </View>
              </BlurView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  contentMobile: {
    alignItems: 'stretch',
  },
  contentDesktop: {
    alignSelf: 'center',
    width: 440,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardBlur: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  cardBlurDesktop: {
    borderRadius: 26,
  },
  cardInner: {
    padding: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardInnerDesktop: {
    padding: 22,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  inputGlass: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  passwordContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 2,
  },
  errorText: {
    marginTop: 6,
    color: '#FF4D4F',
    fontSize: 12,
    fontWeight: '600',
  },
  selectInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  selectCaret: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: -2,
  },
  selectDropdown: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  selectOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonWrap: {
    backgroundColor: '#FFB608',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  buttonWrapDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});
