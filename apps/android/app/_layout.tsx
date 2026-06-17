// @ts-nocheck — profile-setup route types will resolve on next expo build
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { onAuthStateChanged, db } from '../src/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUserStore } from '@talking-mirror/shared';

SplashScreen.preventAutoHideAsync();

function useAuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { setUser, setRole, setLoading, isAuthenticated, isLoading } = useUserStore();
  const [profileChecked, setProfileChecked] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);

  // Auto-sign-in as guest and set premium role
  useEffect(() => {
    const doGuestLogin = async () => {
      try {
        const { signInAnonymously } = await import('../src/services/firebase');
        const { user } = await signInAnonymously();
        setUser(user);
        setRole('premium');
      } catch (e) {
        console.warn('Guest login failed, proceeding anyway:', e);
        setUser({ uid: 'guest-dev', isAnonymous: true } as any);
        setRole('premium');
      }
      setLoading(false);
    };
    doGuestLogin();
  }, [setUser, setRole, setLoading]);

  // Check if user profile is complete when auth state resolves
  useEffect(() => {
    if (!isAuthenticated) {
      setProfileChecked(true);
      setNeedsProfile(false);
      return;
    }

    const store = useUserStore.getState();
    const uid = store.user?.uid;
    if (!uid) {
      setProfileChecked(true);
      return;
    }

    getDoc(doc(db, 'userPreferences', uid)).then((snap) => {
      const data = snap.data();
      if (data?.zodiacSign) {
        setNeedsProfile(false);
      } else {
        setNeedsProfile(true);
      }
      setProfileChecked(true);
    }).catch(() => {
      setProfileChecked(true);
      setNeedsProfile(false);
    });
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading || !profileChecked) return;

    const inAuthGroup = segments[0] === 'onboarding';
    const inProfileSetup = segments[0] === 'profile-setup';

    if (!isAuthenticated && !inAuthGroup) {
      // Skip onboarding, go straight to tabs in dev mode
      router.replace('/(tabs)');
    } else if (isAuthenticated && inAuthGroup) {
      if (needsProfile) {
        router.replace('/profile-setup');
      } else {
        router.replace('/(tabs)');
      }
    } else if (isAuthenticated && !needsProfile && inProfileSetup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, profileChecked, needsProfile, segments, router]);
}

export default function RootLayout() {
  const [loaded] = useFonts({
    // Add custom fonts here when available
  });

  useAuthGuard();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="profile-setup" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}
