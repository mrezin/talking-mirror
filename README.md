# TalkingMirror

> Daily selfie mirror app with compliments, affirmations & lucky colors.

A cross-platform mobile app (iOS & Android) that gives women a confidence boost every morning through a selfie mirror experience with personalized compliments, affirmations, and lucky color advice. Built with **Expo / React Native**, **Firebase**, and **RevenueCat**.

---

## Project Structure

```
talking-mirror/
  apps/
    ios/                  Expo iOS app
    android/              Expo Android app
  services/
    firebase/             Firebase Functions & Firestore
    revenuecat/           RevenueCat subscription config
  packages/
    shared/               Shared types, constants, utilities
  src/
    screens/              Screen-level components
    components/           Reusable UI components
    services/             API clients (Firebase, RevenueCat)
    store/                State management (Zustand)
    hooks/                Custom React hooks
    utils/                Utility functions
  docs/
    PRD.md                Product Requirements Document
    ARCHITECTURE.md       Architecture diagrams & ADRs
    API.md                API specification
  .github/
    workflows/            CI/CD pipelines
    ISSUE_TEMPLATE/       Bug, Feature, Tech Debt templates
    PULL_REQUEST_TEMPLATE.md
    CODEOWNERS
    dependabot.yml
```

---

## Prerequisites

- Node.js 22
- Yarn 4
- Expo CLI: `npm install -g expo-cli`
- Firebase CLI: `npm install -g firebase-tools`
- EAS CLI: `npm install -g eas-cli`
- iOS: Xcode 16 (macOS only)
- Android: Android Studio (API 34)

---

## Setup

### 1. Install dependencies
```bash
git clone https://github.com/mrezin/talking-mirror.git
cd talking-mirror
yarn install
```

### 2. Configure environment variables
```bash
cp .env.example .env
cp services/firebase/.env.example services/firebase/.env
cp services/revenuecat/.env.example services/revenuecat/.env
```

### 3. Run the apps
```bash
# iOS
yarn ios

# Android
yarn android
```

### 4. Firebase emulators (local dev)
```bash
yarn firebase:emulate
```

### 5. TypeScript check all workspaces
```bash
yarn workspaces run typecheck
```

---

## CI/CD

| Workflow | Trigger | What it does |
|---|---|---|
| `android-build.yml` | PR / push to main | Typecheck, Expo prebuild, EAS dry-run |
| `ios-build.yml` | PR / push to main | Typecheck, Expo prebuild, EAS dry-run (macOS) |
| `firebase-deploy.yml` | Push to main | Typecheck, build, deploy to Firebase |

---

## Monetization

| Mode | Description |
|---|---|
| Free Trial | 7-day full Premium access after install |
| Premium | Weekly / Monthly / Yearly subscription via RevenueCat |
| Free (Ads) | AdMob ads shown after trial if no subscription |

---

## Documentation

- Full plan & PRD: [docs/PRD.md](docs/PRD.md)
- Architecture & ADRs: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- API specification: [docs/API.md](docs/API.md)
- Contributing guide: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## License

MIT
