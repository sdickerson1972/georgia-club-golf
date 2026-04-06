# The Georgia Club Golf App — Setup Guide

## What you'll need
- A GitHub account (you already have one)
- A Google account (for Firebase)
- About 20 minutes total

---

## STEP 1 — Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it: `georgia-club-golf` → click Continue
4. Disable Google Analytics (not needed) → click **Create project**
5. Wait for it to initialize, then click **Continue**

---

## STEP 2 — Set up the Realtime Database

1. In the left sidebar, click **Build → Realtime Database**
2. Click **"Create Database"**
3. Choose location: **United States (us-central1)** → Next
4. Select **"Start in test mode"** → Enable
   *(We'll tighten security rules later if needed)*

---

## STEP 3 — Get your Firebase config

1. In the left sidebar, click the ⚙️ gear icon → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click the **`</>`** (Web) icon
4. Register app with nickname: `georgia-club-golf` → click **Register app**
5. You'll see a code block like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "georgia-club-golf.firebaseapp.com",
  databaseURL: "https://georgia-club-golf-default-rtdb.firebaseio.com",
  projectId: "georgia-club-golf",
  storageBucket: "georgia-club-golf.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. **Copy this entire block** — you'll need it in the next step

---

## STEP 4 — Add your Firebase config to the app

1. Open the file `index.html` in a text editor
2. Find this section near the top (around line 20):

```javascript
// ── REPLACE THIS BLOCK with your Firebase config ──
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  ...
};
```

3. Replace the entire `firebaseConfig` object with the one you copied from Firebase
4. Save the file

---

## STEP 5 — Create a GitHub Repository

1. Go to https://github.com and sign in
2. Click the **+** icon → **New repository**
3. Name it: `georgia-club-golf`
4. Set to **Public** (required for free GitHub Pages hosting)
5. Do NOT add README or .gitignore
6. Click **Create repository**

---

## STEP 6 — Upload the files to GitHub

You have two options:

### Option A — Drag and drop (easiest, no Git required)
1. Open your new empty repository on GitHub
2. Click **"uploading an existing file"** link
3. Drag the entire `georgia-club-golf` folder contents into the upload area
   *(Upload all files maintaining the folder structure: css/, js/, index.html, manifest.json)*
4. Scroll down, add commit message: `Initial app upload`
5. Click **Commit changes**

### Option B — Using Git command line
```bash
cd georgia-club-golf
git init
git add .
git commit -m "Initial app upload"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/georgia-club-golf.git
git push -u origin main
```

---

## STEP 7 — Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. In the left sidebar, click **Pages**
4. Under "Source", select **Deploy from a branch**
5. Branch: **main** → Folder: **/ (root)** → Click **Save**
6. Wait 2-3 minutes, then your app will be live at:
   **`https://YOUR_GITHUB_USERNAME.github.io/georgia-club-golf`**

GitHub will show you the exact URL in the Pages settings once it's deployed.

---

## STEP 8 — Share the URL

Send this URL to all your playing partners. On their phone they can:
- Open it in Safari (iPhone) or Chrome (Android)
- Tap **Share → Add to Home Screen** to install it like a real app with its own icon

---

## STEP 9 — First use — Load the Player Roster

1. Open the app
2. Tap **Admin — Player Roster**
3. Enter PIN: **Elite**
4. Add all your regular players with their name, handicap, and preferred tees
5. Tap **Save Roster to Cloud**

The roster is now stored in Firebase and every phone will see the same player list.

---

## How it works on game day

1. **Each group scorer** opens the app URL on their phone
2. Tap **Score a Round**
3. Select your group number (Group 1, 2, 3, etc.)
4. Select the two nines you're playing
5. Add your 5 players from the dropdown
6. Tap **Start Scoring**
7. Enter scores hole by hole — tap **Save** anytime to push to the leaderboard
8. Anyone can open the app and tap **Live Leaderboard** to see all groups' standings

---

## Updating the app in future

If you need to make changes (e.g., update handicaps, fix something), just edit the files and re-upload to GitHub. Changes go live automatically within a minute or two.

---

## Troubleshooting

**App shows "Could not connect to Firebase"**
→ Double-check your firebaseConfig in index.html matches exactly what Firebase gave you

**Scores not showing on leaderboard**
→ Make sure the scorer tapped Save before checking the leaderboard, then tap Refresh

**"Permission denied" error in browser console**
→ Your Firebase database rules may have expired (test mode lasts 30 days). Go to Firebase → Realtime Database → Rules and set:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

## Admin PIN
Your admin PIN is: **Elite**
Keep this private — it controls who can edit the player roster.
