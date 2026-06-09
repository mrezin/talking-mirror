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

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup) {
      // Skip onboarding, go straight to tabs in dev mode
      router.replace('/(tabs)');
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
