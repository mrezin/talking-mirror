# TalkingMirror — API Specification

**Version:** 1.0
**Date:** 2026-05-29

---

## Overview

TalkingMirror uses **Firebase Cloud Functions** (HTTP Callable) as its backend API. All functions require Firebase Auth JWT tokens in the request context unless noted as public.

Base URL: `https://us-central1-talking-mirror.cloudfunctions.net`

---

## Authentication

All authenticated endpoints require a Firebase Auth ID token passed via the Firebase SDK callable context. The SDK handles token management automatically.

Roles enforced server-side via Firestore `users/{userId}.role` field.

---

## Endpoints

### 1. getDailyCompliment

**Type:** HTTPS Callable
**Auth:** Optional (Guest gets basic, Premium gets personalized)

**Request:**
```json
{
  "date": "2026-05-29",
  "language": "en"
}
```

**Response:**
```json
{
  "complimentId": "uuid",
  "text": "You shine brighter than you think.",
  "category": "standard",
  "audioUrl": "https://storage.googleapis.com/...",
  "language": "en"
}
```

**Role behavior:**
- Guest / Free: returns `basic` or `standard` category
- Premium: returns `personalized` or `seasonal` category

---

### 2. getDailyColorAdvice

**Type:** HTTPS Callable
**Auth:** Optional

**Request:**
```json
{
  "date": "2026-05-29",
  "language": "en"
}
```

**Response:**
```json
{
  "colorId": "uuid",
  "hexCode": "#4A90E2",
  "meaning": "Calm Blue - clarity and focus today.",
  "category": "basic",
  "audioUrl": "https://storage.googleapis.com/..."
}
```

**Role behavior:**
- Guest / Free: returns `generic` or `basic` category
- Premium: returns `advanced` with wardrobe suggestions

---

### 3. saveToHistory

**Type:** HTTPS Callable
**Auth:** Required (Free or Premium)

**Request:**
```json
{
  "complimentId": "uuid",
  "colorId": "uuid",
  "favorited": false
}
```

**Response:**
```json
{
  "historyId": "uuid",
  "saved": true
}
```

---

### 4. getHistory

**Type:** HTTPS Callable
**Auth:** Required

**Request:**
```json
{
  "limit": 7
}
```

**Response:**
```json
{
  "history": [
    {
      "historyId": "uuid",
      "complimentId": "uuid",
      "colorId": "uuid",
      "timestamp": "2026-05-29T08:00:00Z",
      "favorited": true
    }
  ]
}
```

**Role behavior:**
- Free: `limit` capped at 7 (last 7 days)
- Premium: `limit` uncapped (unlimited history)

---

### 5. updateUserPreferences

**Type:** HTTPS Callable
**Auth:** Required

**Request:**
```json
{
  "language": "en",
  "notificationTime": "08:00",
  "theme": "dark",
  "cardHeightPct": 20
}
```

**Response:**
```json
{
  "updated": true
}
```

**Note:** `notificationTime` only persisted for Premium users.

---

### 6. toggleFavorite

**Type:** HTTPS Callable
**Auth:** Required

**Request:**
```json
{
  "historyId": "uuid",
  "favorited": true
}
```

**Response:**
```json
{
  "updated": true,
  "favorited": true
}
```

---

### 7. sendDailyNotification (Scheduled)

**Type:** Firebase Scheduled Function
**Schedule:** `every day 08:00` (UTC)
**Auth:** Internal (not callable by clients)

**Logic:**
1. Query all users with `notificationEnabled: true`
2. Group by `notificationTime` preference
3. Send FCM push notification per user
4. Payload: `{ title: "Your daily compliment is ready", body: "Open TalkingMirror" }`

---

### 8. Admin: uploadCompliment

**Type:** HTTPS Callable
**Auth:** Required (Admin role only)

**Request:**
```json
{
  "text": "Your leadership inspires everyone around you.",
  "category": "seasonal",
  "language": "en",
  "audioUrl": "https://storage.googleapis.com/...",
  "tags": ["summer", "leadership"]
}
```

**Response:**
```json
{
  "complimentId": "uuid",
  "created": true
}
```

---

### 9. Admin: uploadColorAdvice

**Type:** HTTPS Callable
**Auth:** Required (Admin role only)

**Request:**
```json
{
  "hexCode": "#50C878",
  "meaning": "Emerald Green - balance and renewal.",
  "category": "advanced",
  "audioUrl": "https://storage.googleapis.com/..."
}
```

**Response:**
```json
{
  "colorId": "uuid",
  "created": true
}
```

---

## RevenueCat Webhook (Firebase Function)

**Endpoint:** `POST /revenuecatWebhook`
**Auth:** Shared secret header `X-RevenueCat-Secret`

**Events handled:**
| Event | Action |
|---|---|
| `INITIAL_PURCHASE` | Set user role to `premium`, record subscription |
| `RENEWAL` | Update `renewalDate` in Firestore |
| `CANCELLATION` | Set subscription status to `canceled` |
| `EXPIRATION` | Set user role to `free`, trigger ads mode |
| `TRIAL_STARTED` | Record `trialEndsAt` |
| `TRIAL_CONVERTED` | Set user role to `premium` |
| `TRIAL_CANCELLED` | Set user role to `free`, trigger ads mode |

---

## Error Codes

| Code | Description |
|---|---|
| `not-found` | Resource does not exist |
| `permission-denied` | User does not have required role |
| `unauthenticated` | No valid Firebase Auth token |
| `invalid-argument` | Missing or invalid request parameter |
| `resource-exhausted` | Rate limit exceeded |

---

## Rate Limits

- Guest: 10 requests/minute
- Free: 30 requests/minute
- Premium: 100 requests/minute
- Admin: unlimited
