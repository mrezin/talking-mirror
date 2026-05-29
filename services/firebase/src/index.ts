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
 * Returns a personalized (or standard) compliment for the requesting user.
 */
export const getDailyCompliment = onCall(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Must be authenticated.');
    }

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const tier = userData?.subscriptionTier ?? 'free';
    const language = userData?.language ?? 'en';

    // Fetch compliment based on tier
    const snapshot = await db
      .collection('compliments')
      .where('language', '==', language)
      .where('tier', 'in', tier === 'premium' ? ['free', 'premium'] : ['free'])
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    if (snapshot.empty) {
      throw new HttpsError('not-found', 'No compliments available.');
    }

    // Pick a random compliment
    const docs = snapshot.docs;
    const randomDoc = docs[Math.floor(Math.random() * docs.length)];

    return {
      id: randomDoc.id,
      ...randomDoc.data(),
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
