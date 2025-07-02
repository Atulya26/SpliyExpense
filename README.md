# Spliy Expense Sharing System

This is a group expense sharing app built with React, Next.js, and Firebase, ready to deploy on Vercel.

## Features
- Create and manage groups
- Add, edit, and delete expenses
- Add and remove group members
- Real-time balance and settlement calculation
- Beautiful, modern UI

## Getting Started

### 1. Firebase Setup
- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
- Enable Firestore Database and Authentication (Anonymous or Custom Token).
- Get your Firebase config object from Project Settings > General > Your apps.

### 2. Environment Variables
- On Vercel, add the following environment variables:
  - `NEXT_PUBLIC_FIREBASE_CONFIG` (stringified JSON of your Firebase config)
  - `NEXT_PUBLIC_APP_ID` (any unique string, e.g., `spliy-expense-app`)

### 3. Deploy to Vercel
- Push this repo to GitHub.
- Import the repo in [Vercel](https://vercel.com/).
- Set the environment variables as above.
- Deploy!

### 4. Share with Your Group
- Share the Vercel app URL with your group members.
- Everyone can join, create, and share expenses in real time.

## Local Development
```bash
npm install
npm run dev
```

## Notes
- All group data is stored in Firestore under the path: `artifacts/{appId}/public/data/groups`.
- User IDs are anonymous unless you implement authentication.
- For custom domains, configure in Vercel dashboard. 