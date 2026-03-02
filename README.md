# YourVideoLog

Record a 5-minute video log entry every evening. Each video is uploaded to Firebase Storage and automatically transcribed (searchable text).

## Features

- **Google sign-in** via Firebase Auth
- **Record up to 5 minutes** of video (camera + microphone)
- **Upload** to Firebase Storage
- **Transcription** via AssemblyAI (audio extracted from video)
- **Past entries** listed with expandable video + transcript

## Setup

### 1. Firebase

- Create a project at [Firebase Console](https://console.firebase.google.com/) (or use the one you already have).
- Enable **Authentication** → Sign-in method → **Google**.
- Create a **Firestore** database.
- Create **Storage** and set your region.
- Optional: copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_*` if you want to override the default Firebase config.

### 2. Deploy security rules

In Firebase Console:

- **Firestore** → Rules: paste the contents of `firestore.rules` and publish.
- **Storage** → Rules: paste the contents of `storage.rules` and publish.

### 3. Transcription (AssemblyAI)

- Sign up at [AssemblyAI](https://www.assemblyai.com/) and get an API key.
- Add to `.env.local`:

```bash
ASSEMBLYAI_API_KEY=your_api_key_here
```

Without this key, upload and listing still work; transcription will fail with a clear message and the entry will show an error state.

### 4. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with Google, then go to **Open diary** to record and view entries.

## Project structure

- `app/page.tsx` – Landing / sign-in
- `app/diary/page.tsx` – Diary list + record flow
- `components/VideoRecorder.tsx` – 5-min max recording UI
- `components/DiaryEntryCard.tsx` – Entry row with video + transcript
- `app/api/transcribe/route.ts` – AssemblyAI transcription API
- `lib/firebase.ts` – Firebase client config
- `lib/diary.ts` – Firestore + Storage helpers
- `lib/types.ts` – `DiaryEntry` type
- `contexts/AuthContext.tsx` – Auth state + Google sign-in

## Tech stack

- Next.js 16, React 19, Tailwind CSS 4
- Firebase (Auth, Firestore, Storage)
- AssemblyAI for transcription
# VideoLogDiary
