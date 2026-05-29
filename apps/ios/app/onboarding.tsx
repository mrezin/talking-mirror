import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import {
  signInAnonymously,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithApple,
} from '../src/services/firebase';
import { useUserStore } from '../src/store/userStore';

// Required for expo-auth-session to handle the OAuth redirect
WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'landing' | 'signin' | 'signup';

const GOOGLE_IOS_CLIENT_ID =
  (Constants.expoConfig?.extra?.googleIosClientId as string) ?? '';
const GOOGLE_ANDROID_CLIENT_ID =
  (Constants.expoConfig?.extra?.googleAndroidClientId as string) ?? '';
const GOOGLE_WEB_CLIENT_ID =
  (Constants.expoConfig?.extra?.googleWebClientId as string) ?? '';

export default function OnboardingScreen() {
  const [mode, setMode] = useState<AuthMode>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setRole } = useUserStore();

  // Google Sign-In via expo-auth-session — provides id_token for Firebase
  const [, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.params?.id_token) {
      setIsLoading(true);
      signInWithGoogle(googleResponse.params.id_token)
        .then(({ user, role }) => {
          setUser(user);
          setRole(role);
        })
        .catch(() => {
          Alert.alert('Error', 'Google Sign-In failed. Please try again.');
        })
        .finally(() => setIsLoading(false));
    } else if (googleResponse?.type === 'error') {
      Alert.alert('Error', 'Google Sign-In failed. Please try again.');
    }
  }, [googleResponse, setUser, setRole]);

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    try {
      const { user, role } = await signInAnonymously();
      setUser(user);
      setRole(role);
    } catch {
      Alert.alert('Error', 'Failed to continue as guest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const { user, role } =
        mode === 'signup'
          ? await signUpWithEmail(email.trim(), password)
          : await signInWithEmail(email.trim(), password);
      setUser(user);
      setRole(role);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await promptGoogleAsync();
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      // Generate a cryptographically secure raw nonce
      const rawNonceBytes = await Crypto.getRandomBytesAsync(32);
      const rawNonce = Array.from(rawNonceBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        Alert.alert('Error', 'Apple Sign-In failed: no identity token received.');
        return;
      }

      const { user, role } = await signInWithApple(credential.identityToken, rawNonce);
      setUser(user);
      setRole(role);
    } catch (error: unknown) {
      // User cancelled Apple Sign-In — not an error
      if (error instanceof Error && (error as { code?: string }).code === 'ERR_CANCELED') {
        return;
      }
      Alert.alert('Error', 'Apple Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9b59b6" />
        <Text style={styles.loadingText}>Signing you in…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>✨</Text>
          <Text style={styles.title}>TalkingMirror</Text>
          <Text style={styles.subtitle}>Your daily compliment, waiting for you.</Text>
        </View>

        {mode === 'landing' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGuestSignIn}>
              <Text style={styles.primaryButtonText}>Continue as Guest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setMode('signup')}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => setMode('signin')}
            >
              <Text style={styles.outlineButtonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
              <Text style={styles.socialButtonText}>🔵  Sign in with Google</Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}
          </View>
        )}

        {(mode === 'signin' || mode === 'signup') && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleEmailAuth}>
              <Text style={styles.primaryButtonText}>
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.textButton} onPress={() => setMode('landing')}>
              <Text style={styles.textButtonText}>← Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.textButton}
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              <Text style={styles.textButtonText}>
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.legalText}>
          By continuing you agree to our{' '}
          <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#ccc',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#9b59b6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#2d2d4e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#9b59b6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#9b59b6',
    fontSize: 16,
    fontWeight: '600',
  },
  socialButton: {
    backgroundColor: '#2d2d4e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  appleButton: {
    width: '100%',
    height: 52,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3d3d5e',
  },
  dividerText: {
    color: '#888',
    fontSize: 13,
    marginHorizontal: 12,
  },
  formContainer: {
    gap: 12,
  },
  formTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2d2d4e',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3d3d5e',
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  textButtonText: {
    color: '#9b59b6',
    fontSize: 15,
  },
  legalText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
  },
  legalLink: {
    color: '#9b59b6',
    textDecorationLine: 'underline',
  },
});
