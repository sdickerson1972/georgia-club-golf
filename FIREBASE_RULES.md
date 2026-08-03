# Firebase Security Rules & Admin Auth Setup

## Step 1 — Enable Email/Password Authentication

1. Go to https://console.firebase.google.com → your project
2. Click **Build → Authentication** in the left sidebar
3. Click **Get started** (or **Sign-in method** tab)
4. Click **Email/Password** → Enable the first toggle → **Save**

## Step 2 — Create the Admin User

1. Still in Authentication, click the **Users** tab
2. Click **Add user**
3. Enter an email (e.g. `admin@georgiagolfclub.com`) and a strong password
4. Click **Add user**
5. **Copy the email and password** — you'll need them in Step 3

## Step 3 — Add admin credentials to index.html

Open `index.html` and find these two lines:

```javascript
window._adminEmail    = "YOUR_ADMIN_EMAIL";
window._adminPassword = "YOUR_ADMIN_PASSWORD";
```

Replace with the email and password you just created:

```javascript
window._adminEmail    = "admin@georgiagolfclub.com";
window._adminPassword = "your-strong-password-here";
```

Save and re-upload `index.html` to GitHub.

## Step 4 — Set the Database Security Rules

1. Go to Firebase Console → **Build → Realtime Database**
2. Click the **Rules** tab
3. Replace everything with:

```json
{
  "rules": {
    "roster": {
      ".read": true,
      ".write": "auth != null"
    },
    "rounds": {
      "$date": {
        "$group": {
          ".read": true,
          ".write": true
        }
      }
    }
  }
}
```

4. Click **Publish**

## What these rules do

- **Roster read** — any phone can load the player list (needed for setup)
- **Roster write** — only an authenticated admin user can save roster changes
- **Rounds read/write** — any phone can read and write scores (needed for live group scoring)
- **Everything else** — blocked completely

## How it works in the app

When you enter the admin PIN in the app, it:
1. Checks the PIN locally (fast)
2. Signs into Firebase with the admin credentials (gives write permission)
3. Now "Save Roster to Cloud" works

When you tap ← Back from the admin screen, it signs out automatically, revoking write access.
