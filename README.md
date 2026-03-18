# CarryMitra — Peer-to-Peer Parcel Delivery

A modern, mobile-first parcel delivery platform built with Next.js 14 and Firebase.

## 🚀 Features
- **Phone OTP Login**: Real SMS authentication via Firebase.
- **Live Tracking**: Real-time location sharing via Firebase RTDB + Leaflet maps.
- **Real-time Chat**: WhatsApp-style interface for senders and carriers.
- **PWA Ready**: Installable on Android and iPhone for a native app feel.
- **Smart Dashboard**: Contextual views for Senders and Carriers.
- **KYC Verification**: Simulated Aadhaar verification flow.

## 🛠️ Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Firebase Auth, Firestore, Realtime DB, Storage
- **Maps**: Leaflet.js + OpenStreetMap
- **Deployment**: Vercel

## ⚙️ Local Setup

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Firebase Configuration**:
   Create a project on [Firebase Console](https://console.firebase.google.com/) and enable:
   - Authentication (Phone)
   - Firestore Database
   - Realtime Database
   - Storage

3. **Environment Variables**:
   Copy the values from your Firebase Project Settings to `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
   ```

4. **Seed Demo Data**:
   ```bash
   node scripts/seedDemo.js
   ```

5. **Run Locally**:
   ```bash
   npm run dev
   ```

## 🔐 Firestore Security Rules
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /parcels/{parcelId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /chats/{parcelId}/messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🌐 Deployment
1. Connect your repo to **Vercel**.
2. Add the environment variables in Vercel Dashboard.
3. Deploy!

---
*Built for Startup Incubation Demo*
