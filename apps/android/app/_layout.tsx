import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { onAuthStateChanged } from '../src/services/firebase';
import { useUserStore } from '../src/store/userStore';

SplashScreen.preventAutoHideAsync();

function useAuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { setUser, setRole, setLoading, isAuthenticated, isLoading } = useUserStore();

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

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/onboarding');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);
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
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}
