/**
 * TalkingMirror Firebase Cloud Functions
 *
 * Entry point for all Cloud Functions.
 * Deployed via: yarn deploy:firebase
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { setGlobalOptions } from 'firebase-functions/v2';
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import type { UserDocument } from './types';

admin.initializeApp();
const db = admin.firestore();

// Set global region
setGlobalOptions({ region: 'us-central1' });

// ─────────────────────────────────────────────────────────
// COMPLIMENTS
// ─────────────────────────────────────────────────────────

/**
 * getDailyCompliment
 * Returns a contextual daily impulse, personalized by zodiac sign, focus, and timezone.
 * Falls back to legacy `compliments` collection if no dailyImpulses match.
 */
export const getDailyCompliment = onCall(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Must be authenticated.');
    }

    const {
      zodiacSign,
      focus,
      timezone,
    } = request.data as {
      zodiacSign?: string;
      focus?: string;
      timezone?: string;
    };

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const tier = userData?.subscriptionTier ?? 'free';
    const language = userData?.language ?? 'en';

    // Calculate today's date in the user's timezone
    const now = new Date();
    let today: string;
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      const parts = new Intl.DateTimeFormat('en-CA', options).format(now);
      today = parts; // 'YYYY-MM-DD' in en-CA locale
    } catch {
      today = now.toISOString().split('T')[0];
    }

    // Try dailyImpulses collection first (contextual impulse for this user)
    if (zodiacSign && focus) {
      // Exact match: zodiac + focus
      let snapshot = await db
        .collection('dailyImpulses')
        .where('date', '==', today)
        .where('zodiacSign', '==', zodiacSign)
        .where('focus', '==', focus)
        .limit(1)
        .get();

      // Fallback: zodiac + 'all' focus
      if (snapshot.empty) {
        snapshot = await db
          .collection('dailyImpulses')
          .where('date', '==', today)
          .where('zodiacSign', '==', zodiacSign)
          .where('focus', '==', 'all')
          .limit(1)
          .get();
      }

      // Fallback: 'all' zodiac + focus
      if (snapshot.empty) {
        snapshot = await db
          .collection('dailyImpulses')
          .where('date', '==', today)
          .where('zodiacSign', '==', 'all')
          .where('focus', '==', focus)
          .limit(1)
          .get();
      }

      // Fallback: 'all' zodiac + 'all' focus
      if (snapshot.empty) {
        snapshot = await db
          .collection('dailyImpulses')
          .where('date', '==', today)
          .where('zodiacSign', '==', 'all')
          .where('focus', '==', 'all')
          .limit(1)
          .get();
      }

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          text: doc.data().text,
          category: 'personalized',
          language,
          tier: 'free',
          audioUrl: doc.data().audioUrl || '',
          createdAt: doc.data().createdAt || null,
          createdBy: 'system',
        };
      }
    }

    // Legacy fallback: compliments collection
    const snapshot = await db
      .collection('compliments')
      .where('language', '==', language)
      .where('tier', 'in', tier === 'premium' ? ['free', 'premium'] : ['free'])
      .get();

    if (snapshot.empty) {
      throw new HttpsError('not-found', 'No daily impulse available.');
    }

    const docs = snapshot.docs;
    const startOfYear = new Date(now.getUTCFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = dayOfYear % docs.length;

    return {
      id: docs[index].id,
      ...docs[index].data(),
    };
  }
);

/**
 * getLuckyColor
 * Returns the lucky color advice for today.
 */
export const getLuckyColor = onCall(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Must be authenticated.');
    }

    const today = new Date().toISOString().split('T')[0];

    const snapshot = await db
      .collection('colorAdvice')
      .where('date', '==', today)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new HttpsError('not-found', 'No color advice for today.');
    }

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    };
  }
);

// ─────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────

/**
 * onAuthUserCreated
 * Triggered when a new Firebase Auth user is created (any provider).
 * Creates the `users/{userId}` Firestore document if it doesn't exist yet.
 * This acts as a safety net alongside the client-side syncUserDoc logic.
 */
export const onAuthUserCreated = beforeUserCreated(async (event) => {
  const user = event.data;
  if (!user) return;

  const isAnonymous = !user.email && !user.providerData?.length;
  const role = isAnonymous ? 'guest' : 'free';

  const userRef = db.collection('users').doc(user.uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    const userDoc: UserDocument = {
      email: user.email ?? null,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    };
    await userRef.set(userDoc);
  }
});

/**
 * onUserCreated
 * Triggered when a new user document is created in Firestore.
 * Sets up default preferences.
 */
export const onUserCreated = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const userId = event.params.userId;

    await db.collection('userPreferences').doc(userId).set({
      theme: 'dark',
      language: 'en',
      notificationsEnabled: true,
      notificationTime: '08:00',
      favorites: [],
      cardHeightPct: 20,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);

// ─────────────────────────────────────────────────────────
// SCHEDULED FUNCTIONS
// ─────────────────────────────────────────────────────────

/**
 * sendDailyNotifications
 * Scheduled every morning to send push notifications to users.
 */
export const sendDailyNotifications = onSchedule(
  {
    schedule: 'every day 08:00',
    timeZone: 'UTC',
  },
  async () => {
    const usersSnapshot = await db
      .collection('userPreferences')
      .where('notificationsEnabled', '==', true)
      .get();

    const messages: admin.messaging.Message[] = [];

    for (const doc of usersSnapshot.docs) {
      const prefs = doc.data();
      if (prefs.fcmToken) {
        messages.push({
          token: prefs.fcmToken,
          notification: {
            title: 'Good Morning! ✨',
            body: "Your daily mirror is ready. You're going to shine today!",
          },
          data: { screen: 'mirror' },
        });
      }
    }

    if (messages.length > 0) {
      await admin.messaging().sendEach(messages);
    }
  }
);
