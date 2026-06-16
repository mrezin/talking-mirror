// @ts-nocheck - Firebase v10 RN types missing
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  signInAnonymously as _signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as _signOut,
  onAuthStateChanged as _onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export type { User };
export type UserRole = 'guest' | 'free' | 'premium' | 'admin';

// ─────────────────────────────────────────────────────────
// Firebase Initialization
// ─────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: (Constants.expoConfig?.extra?.firebaseApiKey as string) ?? '',
  authDomain: (Constants.expoConfig?.extra?.firebaseAuthDomain as string) ?? '',
  projectId: (Constants.expoConfig?.extra?.firebaseProjectId as string) ?? '',
  storageBucket: (Constants.expoConfig?.extra?.firebaseStorageBucket as string) ?? '',
  messagingSenderId: (Constants.expoConfig?.extra?.firebaseMessagingSenderId as string) ?? '',
  appId: (Constants.expoConfig?.extra?.firebaseAppId as string) ?? '',
};

// Prevent duplicate initialization on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Lazy auth initialization — avoids "Component auth has not been registered yet"
// race when the eager IIFE calls getAuth() before @firebase/auth registers.
let _authInstance: ReturnType<typeof getAuth> | null = null;
function getAuthInstance() {
  if (_authInstance) return _authInstance;
  try {
    _authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if auth has already been initialized
    _authInstance = getAuth(app);
  }
  return _authInstance;
}

export const db = getFirestore(app);

// ─────────────────────────────────────────────────────────
// Firestore User Document Helpers
// ─────────────────────────────────────────────────────────

/**
 * Creates a new user document in Firestore on first sign-in,
 * or updates lastLogin on subsequent sign-ins.
 * Returns the user's role.
 */
async function syncUserDoc(user: User): Promise<UserRole> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const role: UserRole = user.isAnonymous ? 'guest' : 'free';
    await setDoc(userRef, {
      email: user.email ?? null,
      role,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    return role;
  }

  // Update lastLogin on existing doc
  await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
  return (userSnap.data()?.role as UserRole) ?? (user.isAnonymous ? 'guest' : 'free');
}

// ─────────────────────────────────────────────────────────
// Auth Methods
// ─────────────────────────────────────────────────────────

/** Sign in anonymously (Guest mode). */
export async function signInAnonymously(): Promise<{ user: User; role: UserRole }> {
  const { user } = await _signInAnonymously(getAuthInstance());
  const role = await syncUserDoc(user);
  return { user, role };
}

/** Sign in with email and password. */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ user: User; role: UserRole }> {
  const { user } = await signInWithEmailAndPassword(getAuthInstance(), email, password);
  const role = await syncUserDoc(user);
  return { user, role };
}

/** Register a new account with email and password. */
export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{ user: User; role: UserRole }> {
  const { user } = await createUserWithEmailAndPassword(getAuthInstance(), email, password);
  const role = await syncUserDoc(user);
  return { user, role };
}

/**
 * Complete Google Sign-In using an ID token obtained from expo-auth-session.
 * The caller is responsible for running the Google OAuth flow and providing the idToken.
 */
export async function signInWithGoogle(
  idToken: string,
): Promise<{ user: User; role: UserRole }> {
  const credential = GoogleAuthProvider.credential(idToken);
  const { user } = await signInWithCredential(getAuthInstance(), credential);
  const role = await syncUserDoc(user);
  return { user, role };
}

/**
 * Complete Apple Sign-In using credentials from expo-apple-authentication.
 * The identityToken and rawNonce must be provided by the caller.
 */
export async function signInWithApple(
  identityToken: string,
  rawNonce: string,
): Promise<{ user: User; role: UserRole }> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken, rawNonce });
  const { user } = await signInWithCredential(getAuthInstance(), credential);
  const role = await syncUserDoc(user);
  return { user, role };
}

/** Sign out the current user. */
export async function signOut(): Promise<void> {
  await _signOut(getAuthInstance());
}

/** Save user profile (zodiac sign + daily focus) to Firestore userPreferences. */
export async function saveUserProfile(
  uid: string,
  zodiacSign: string,
  dailyFocus: string,
): Promise<void> {
  const prefsRef = doc(db, 'userPreferences', uid);
  await setDoc(
    prefsRef,
    { zodiacSign, dailyFocus },
    { merge: true },
  );
}

/**
 * Subscribe to Firebase auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChanged(
  callback: (user: User | null) => void,
): () => void {
  return _onAuthStateChanged(getAuthInstance(), callback);
}
