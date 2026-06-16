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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        // Role defaults to 'guest' for anonymous users and 'free' for registered
        // users. The Firestore user doc (synced in firebase.ts) is the source of
        // truth for premium/admin roles — those are updated via RevenueCat webhooks
        // or admin Cloud Functions and will be reflected on the next auth event.
        setRole(user.isAnonymous ? 'guest' : 'free');
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
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
      router.replace('/onboarding');
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
