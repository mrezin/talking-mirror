# TalkingMirror — Architecture Document

**Version:** 1.0
**Date:** 2026-05-29

---

## 1. High-Level Architecture

```
+---------------------------+
|       Mobile App          |
|  React Native + Expo      |
|  iOS & Android            |
+---------------------------+
           |
    +------+------+
    |              |
+---v---+    +----v-----+
|Firebase|    |RevenueCat|
|Backend |    |  (IAP)   |
+--------+    +----------+
    |
+---+---------------------------+
|   Firebase Services           |
|   - Auth                      |
|   - Firestore (DB)            |
|   - Storage (Audio files)     |
|   - Cloud Functions           |
|   - Cloud Messaging (FCM)     |
|   - Analytics                 |
+-------------------------------+
```

---

## 2. Monorepo Structure

```
talking-mirror/                    Root workspace
  apps/
    ios/                           Expo iOS app (React Native)
      app/                         Expo Router file-based routing
        (tabs)/
          index.tsx                Mirror Screen (main)
          history.tsx              Compliment History
          upgrade.tsx              Subscription / Paywall
          settings.tsx             Settings
        onboarding.tsx             Splash / Onboarding
        _layout.tsx                Root layout
      app.json
      tsconfig.json
      package.json
    android/                       Expo Android app (React Native)
      (same structure as iOS)
  services/
    firebase/                      Firebase backend
      src/
        index.ts                   Cloud Functions entry
        types.ts                   Firestore types
      seed/
        compliments-sample.json    Sample compliments data
        colors-sample.json         Sample color advice data
      firestore.rules
      firestore.indexes.json
      firebase.json
      .env.example
      tsconfig.json
      package.json
    revenuecat/                    RevenueCat config
      src/
        config.ts                  Product IDs, entitlements
        types.ts                   SubscriptionStatus, PaywallProduct
      .env.example
      tsconfig.json
      package.json
  packages/
    shared/                        Shared code
      src/
        constants.ts               Colors, spacing, app config
        types/
          index.ts                 User, Compliment, ColorAdvice types
        utils/
          date.ts                  Date formatting
          subscription.ts          Trial logic helpers
      tsconfig.json
      package.json
  src/                             Shared app source
    screens/                       Screen-level components
    components/                    Reusable UI components
      MirrorCamera.tsx             Selfie camera + beauty filter
      ComplimentCard.tsx           Bottom overlay card
      AudioPlayer.tsx              Audio playback component
      ColorSwatch.tsx              Color advice display
    services/                      API clients
      firebase.ts
      revenuecat.ts
      admob.ts
    store/                         Zustand state management
      userStore.ts
      subscriptionStore.ts
    hooks/
      useCompliment.ts
      useColorAdvice.ts
      useSubscription.ts
    utils/
  docs/
  .github/
```

---

## 3. Key Architectural Decisions (ADRs)

### ADR-001: Monorepo with Yarn Workspaces
- **Decision:** Single repo with apps/ios, apps/android, services/firebase, services/revenuecat, packages/shared
- **Reason:** Shared types and utilities between iOS and Android; simpler CI/CD
- **Trade-off:** More complex initial setup

### ADR-002: Expo + React Native (not bare RN)
- **Decision:** Use Expo SDK with EAS Build
- **Reason:** Faster development, OTA updates, simplified camera/audio APIs
- **Trade-off:** Some native module limitations

### ADR-003: Firebase as primary backend
- **Decision:** Firestore + Auth + Storage + Cloud Functions + FCM
- **Reason:** Real-time data, serverless, built-in auth, tight integration
- **Trade-off:** Vendor lock-in; cold start latency on Functions

### ADR-004: RevenueCat for subscriptions
- **Decision:** RevenueCat instead of direct StoreKit/Google Billing
- **Reason:** Cross-platform entitlements, webhook support, analytics, reduces IAP complexity
- **Trade-off:** Additional service dependency

### ADR-005: Zustand for state management
- **Decision:** Zustand over Redux
- **Reason:** Simpler API, less boilerplate, sufficient for app complexity
- **Trade-off:** Less ecosystem tooling than Redux DevTools

### ADR-006: 7-day free trial via RevenueCat
- **Decision:** Trial managed by RevenueCat + App Store / Play Store trial mechanism
- **Reason:** Platform-native trial handling, automatic expiry, no server logic needed
- **Trade-off:** Platform-specific behavior differences

---

## 4. Data Flow

### Mirror Screen Load
```
App Open
  -> Check RevenueCat entitlement (isPremium?)
  -> Fetch today's compliment from Firestore
  -> Fetch today's color advice from Firestore
  -> Render MirrorCamera + ComplimentCard
  -> If isPremium: show personalized content
  -> If Free+Ads: load AdMob banner
```

### Subscription Flow
```
User taps Upgrade
  -> PaywallScreen loads RevenueCat offerings
  -> User selects plan (Weekly/Monthly/Yearly)
  -> RevenueCat initiates purchase (StoreKit/Google Billing)
  -> On success: entitlement updated
  -> userStore.setIsPremium(true)
  -> Mirror Screen reloads with Premium content
```

### Free Trial Expiry
```
App Open (Day 8)
  -> RevenueCat checks trial status
  -> Trial expired + no active subscription
  -> userStore.setIsPremium(false)
  -> AdMob ads shown
  -> Paywall upsell prompt shown
```

### Push Notification Flow
```
Firebase Scheduled Function (daily @ 08:00 UTC)
  -> Query users with notifications enabled
  -> Send FCM message per user preferred time
  -> User opens notification -> App opens to Mirror Screen
```

---

## 5. Firestore Schema

```
collections:
  users/{userId}
    email: string
    role: 'guest' | 'free' | 'premium' | 'admin'
    subscriptionId: string
    createdAt: timestamp
    lastLogin: timestamp
    avatarGender: 'female' | 'male'

  userPreferences/{userId}
    language: 'en' | 'ru' | 'zh'
    notificationTime: string  // 'HH:MM'
    theme: 'light' | 'dark' | 'custom'
    favorites: string[]  // compliment/color IDs
    cardHeightPct: number  // 15-30

  compliments/{complimentId}
    text: string
    category: 'basic' | 'standard' | 'personalized' | 'seasonal'
    language: 'en' | 'ru' | 'zh'
    audioUrl: string
    createdAt: timestamp
    createdBy: string

  colorAdvice/{colorId}
    hexCode: string
    meaning: string
    category: 'generic' | 'basic' | 'advanced'
    audioUrl: string
    createdAt: timestamp
    createdBy: string

  history/{historyId}
    userId: string
    complimentId: string
    colorId: string
    timestamp: timestamp
    favorited: boolean

  subscriptions/{subscriptionId}
    userId: string
    plan: 'weekly' | 'monthly' | 'yearly'
    status: 'active' | 'expired' | 'canceled'
    startDate: timestamp
    endDate: timestamp
    renewalDate: timestamp
    trialEndsAt: timestamp
```

---

## 6. CI/CD Pipeline

```
PR opened / push to main
  -> android-build.yml
       Lint & Typecheck (all workspaces)
       Expo prebuild --platform android
       EAS build dry-run
  -> ios-build.yml (macOS runner)
       Lint & Typecheck
       Expo prebuild --platform ios
       EAS build dry-run
  -> firebase-deploy.yml (push to main only)
       Firebase Functions typecheck
       Firebase Functions build
       Deploy to Firebase (functions + firestore rules)
```

---

## 7. Security

- Firestore rules: users can only read/write their own documents
- Compliments & Color Advice: world-readable, admin-write only
- RevenueCat webhooks: validated via shared secret
- Firebase Auth: JWT-based, short-lived tokens
- Admin Dashboard: separate Firebase project or custom claims
- No sensitive data in URL params or client-side storage
