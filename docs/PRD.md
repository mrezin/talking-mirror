# TalkingMirror — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** 2026-05-29
**Author:** mrezin
**Status:** Draft

---

## 1. Goal

Build **TalkingMirror** so women can get compliments and a good mood every morning through a selfie mirror experience with daily personalized affirmations and lucky color advice.

**Category:** Lifestyle / Mindfulness
**Platforms:** iOS & Android (React Native + Expo)

---

## 2. User Roles & Permissions

| Role | Description | Access |
|---|---|---|
| Guest | No sign-up required | Basic daily compliment, generic color advice, no history, no personalization |
| Free Registered | Firebase Auth (email, Google, Apple) | Standard compliments, basic color, 7-day history, upsell prompts |
| Premium Subscriber | Verified via RevenueCat entitlement | Personalized compliments, advanced color/wardrobe tips, unlimited history, ad-free, custom notification time, exclusive packs |
| Admin (internal) | Hidden dashboard | Manage compliment DB, upload audio, push seasonal packs, analytics |

---

## 3. Data Model

### Users
| Field | Type | Description |
|---|---|---|
| user_id | String (UUID) | Unique identifier |
| email | String | Nullable for Guest |
| role | Enum | Guest / Free / Premium / Admin |
| subscription_id | String | RevenueCat entitlement ID |
| created_at | Timestamp | Account creation date |
| last_login | Timestamp | Last login date |
| avatar_gender | Enum | Female / Male (face overlay) |

### Compliments
| Field | Type | Description |
|---|---|---|
| compliment_id | String (UUID) | Unique entry |
| text | String | Compliment text (max 300 chars) |
| category | Enum | Basic / Standard / Personalized / Seasonal |
| language | String | en / ru / zh |
| audio_url | String | Firebase Storage link |
| created_at | Timestamp | Date added |
| created_by | String | Admin ID |

### Color Advice
| Field | Type | Description |
|---|---|---|
| color_id | String (UUID) | Unique entry |
| hex_code | String | HEX value (#RRGGBB) |
| meaning | String | Description (luck, mood, style) |
| category | Enum | Generic / Basic / Advanced |
| audio_url | String | Firebase Storage link (optional) |
| created_at | Timestamp | Date added |
| created_by | String | Admin ID |

### User Preferences
| Field | Type | Description |
|---|---|---|
| preference_id | String (UUID) | Unique entry |
| user_id | String | Linked to Users |
| language | String | Preferred language |
| notification_time | Time | Daily push time (HH:MM) |
| theme | String | light / dark / custom |
| favorites | Array[String] | Saved compliment/color IDs |
| card_height_pct | Integer | Bottom card height (15-30%) |

### History
| Field | Type | Description |
|---|---|---|
| history_id | String (UUID) | Unique entry |
| user_id | String | Linked to Users |
| compliment_id | String | Linked to Compliments |
| color_id | String | Linked to Color Advice |
| timestamp | Timestamp | When advice was shown |
| favorited | Boolean | Whether user saved it |

### Subscriptions
| Field | Type | Description |
|---|---|---|
| subscription_id | String | RevenueCat entitlement ID |
| user_id | String | Linked to Users |
| plan | Enum | Free / Weekly / Monthly / Yearly |
| status | Enum | Active / Expired / Canceled |
| start_date | Timestamp | Subscription start |
| end_date | Timestamp | Subscription end |
| renewal_date | Timestamp | Next renewal date |
| trial_ends_at | Timestamp | 7-day free trial end date |

---

## 4. Screens & Navigation

### Screen List

| Screen | Role Access | Key Actions |
|---|---|---|
| Splash / Onboarding | All | Animated logo, Continue as Guest or Sign Up |
| Mirror (Main) | All | Selfie camera + face overlay + compliment card + audio |
| Compliment History | Free (7 days) / Premium (unlimited) | Timeline, favorites, filter |
| Subscription / Paywall | All | Tier selection, RevenueCat purchase flow |
| Settings | Registered | Language, notification time, theme, account |
| Admin Dashboard | Admin only | Manage DB, upload audio, push packs |

### Navigation Flow

```
Splash
  └── Mirror Screen (default hub)
        ├── History Screen
        ├── Subscription Screen (Paywall)
        └── Settings Screen

Admin route: secure login -> Admin Dashboard (hidden)
```

### Navigation Pattern
- **Bottom Tab Bar**: Mirror (home), History, Upgrade, Settings
- Back navigation always returns to Mirror Screen

---

## 5. Core Workflows

### Workflow 1: Guest Entry
- Anna opens the app (no sign-up)
- Splash dissolves into mirror effect with face overlay
- A compliment card appears at bottom 15-30% of screen
- She taps audio button, hears compliment aloud
- "Sign Up for More" prompt shown after 3rd session

**Acceptance Criteria:**
- GIVEN a new user opens the app
- WHEN they choose "Continue as Guest"
- THEN they see the Mirror screen with a basic daily compliment and generic color card, no sign-in required

---

### Workflow 2: Free User Daily Ritual
- David signs up with Google
- Opens app each morning: selfie + overlay + compliment card
- Taps audio, listens, saves to favorites
- Checks History (last 7 days)
- Banner nudges: "Unlock unlimited history with Premium"

**Acceptance Criteria:**
- GIVEN a free registered user opens the app
- WHEN the Mirror Screen loads
- THEN a new daily compliment + color advice is shown, audio playable, and history shows max 7 days

---

### Workflow 3: Premium Experience
- Maria upgrades to Premium
- Personalized compliment + advanced color card (wardrobe tips)
- Sets notification time to 08:00 AM
- Unlimited history, ad-free, custom voice styles

**Acceptance Criteria:**
- GIVEN a Premium subscriber
- WHEN they open the app
- THEN they see a personalized compliment, advanced color advice, no ads, and have access to unlimited history and notification scheduling

---

### Workflow 4: Free Trial -> Paid Subscription
- New user installs app
- 7-day free trial starts automatically (full Premium features)
- On day 8: RevenueCat prompts subscription selection
- If user subscribes: continues as Premium
- If user declines: switches to Free + Ads mode (AdMob)

**Acceptance Criteria:**
- GIVEN a new install
- WHEN the app is opened for the first time
- THEN a 7-day free trial with full Premium features begins
- AND WHEN the trial expires without subscription
- THEN the app switches to Free + Ads mode

---

### Workflow 5: Subscription Cancellation -> Ads Mode
- Maria cancels her subscription
- App detects cancellation via RevenueCat webhook
- At next app open: switches to Free + Ads mode
- AdMob banner ads appear at Mirror Screen bottom
- Upsell prompt reappears

**Acceptance Criteria:**
- GIVEN a Premium subscriber cancels
- WHEN RevenueCat confirms cancellation
- THEN the app switches to Free + Ads mode on next session
- AND AdMob ads appear, premium features are locked

---

### Workflow 6: Admin Content Update
- Alex logs into Admin Dashboard
- Uploads summer seasonal compliment pack
- Attaches TTS audio files per compliment
- Saves to Firestore
- Users see fresh content next day without app update

**Acceptance Criteria:**
- GIVEN an Admin is logged in
- WHEN they upload new compliments with audio
- THEN compliments appear in the app for users the following day without a new app release

---

## 6. Monetization

| Mode | Trigger | Features |
|---|---|---|
| Free Trial | First install | 7 days full Premium |
| Premium Weekly | Subscribed | $2.99/week, all premium features |
| Premium Monthly | Subscribed | $7.99/month, all premium features |
| Premium Yearly | Subscribed | $39.99/year, best value |
| Free + Ads | Trial expired, no sub / Canceled | AdMob banner ads, limited history, basic compliments |

---

## 7. Design System

### Visual Style
- Clean Material 3 with custom dark theme overlay
- Rounded corners, soft shadows, semi-transparent overlays for camera feed
- Smooth dissolve transitions (face -> mirror -> user reflection)

### Color Palette
| Color | HEX | Usage |
|---|---|---|
| Calm Blue | #4A90E2 | Primary, CTAs, trust |
| Warm Coral | #FF6F61 | Compliment highlights |
| Emerald Green | #50C878 | Lucky color advice |
| Pure White | #FFFFFF | Background, text clarity |
| Deep Dark | #121212 | Dark theme background |

### Typography
- Android: Google Sans / Roboto (Material 3)
- iOS: SF Pro
- Compliment text: Medium 16-18pt
- Color advice: Regular 14-16pt
- Headings: Bold 20-24pt

### Key Components
- Compliment Card: Bottom 15-30% overlay, rounded, semi-transparent
- Primary Button: Filled, rounded, accent color
- Subscription Modal: Full-screen, tiered pricing cards
- Settings Sheet: Bottom sheet modal

### Accessibility
- WCAG AA (min contrast 4.5:1)
- Dynamic font scaling
- Screen reader support
- Min 44px touch targets
- Optional spoken compliments via audio files

---

## 8. Integrations & Services

| Service | Purpose |
|---|---|
| Firebase Auth | Email, Google, Apple, Anonymous login |
| Firebase Firestore | Users, compliments, color advice, preferences, history |
| Firebase Storage | Audio files (TTS compliments) |
| Firebase Cloud Functions | Scheduled daily content delivery, notification triggers |
| Firebase Cloud Messaging | Daily push notifications (morning affirmation reminder) |
| RevenueCat | Cross-platform subscription management (IAP + entitlements) |
| Google AdMob | Banner ads for Free + Ads mode |
| Firebase Analytics | Event tracking, conversion funnels |
| Sentry | Crash & error monitoring |
| GitHub Actions + EAS | CI/CD: typecheck, prebuild, build, deploy |

---

## 9. Sprint Roadmap

### v0.1 — MVP (Sprint 1-3, ~6 weeks)
- [ ] Repo setup (monorepo, Expo, Firebase, RevenueCat)
- [ ] Firebase Auth (email, Google, Apple, Anonymous)
- [ ] Mirror Screen: selfie camera + subtle beauty filter + compliment card
- [ ] Static compliments library (EN, 50 entries)
- [ ] Basic color advice (10 colors)
- [ ] Guest & Free user roles
- [ ] Splash / Onboarding screen
- [ ] Settings screen (language, theme)
- [ ] CI/CD: GitHub Actions (typecheck + EAS dry-run)

### v0.2 — Beta (Sprint 4-6, ~6 weeks)
- [ ] RevenueCat integration (Weekly, Monthly, Yearly)
- [ ] 7-day free trial logic
- [ ] AdMob integration (Free + Ads mode)
- [ ] Firebase Cloud Messaging (push notifications)
- [ ] Audio playback (Firebase Storage TTS files)
- [ ] Compliment History screen (7-day limit for Free)
- [ ] Subscription / Paywall screen
- [ ] Russian (RU) and Chinese (ZH) language support
- [ ] Admin Dashboard (internal web)

### v1.0 — Release (Sprint 7-9, ~6 weeks)
- [ ] Personalized compliments (Premium AI-driven)
- [ ] Advanced color advice + wardrobe suggestions
- [ ] Unlimited history & favorites (Premium)
- [ ] Seasonal packs (Admin-pushed)
- [ ] Custom audio voice styles (Premium)
- [ ] WCAG AA accessibility audit
- [ ] Performance optimization (startup < 2s)
- [ ] App Store + Google Play submission
- [ ] Sentry crash monitoring
- [ ] Firebase Analytics dashboards

---

## 10. Out of Scope (MVP)

- Social feed / community features
- In-app chat or comments
- Real-time AI generation (MVP uses curated library)
- Custom user avatars upload
- Web app version
