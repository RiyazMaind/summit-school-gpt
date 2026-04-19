# Firebase Setup Quick Start

## Prerequisites

- Node.js or Bun installed
- Firebase account

## Step-by-Step Firebase Setup

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Create project"
3. Enter your project name: `Kodeshala`
4. Click "Continue"
5. Disable Google Analytics (not needed for this app)
6. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Email/Password**
3. Toggle **Enable** and select "Email/Password"
4. Click **Save**

### 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select region closest to you (e.g., Asia South 1 for India)
5. Click **Create**

### 4. Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click on the Web app (or create one if not exists)
4. Copy the Firebase config

### 5. Create `.env.local` File

In your project root, create `.env.local`:

```
VITE_FIREBASE_API_KEY=your_value_here
VITE_FIREBASE_AUTH_DOMAIN=your_value_here
VITE_FIREBASE_PROJECT_ID=your_value_here
VITE_FIREBASE_STORAGE_BUCKET=your_value_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_value_here
VITE_FIREBASE_APP_ID=your_value_here
```

Get these from the Firebase config shown in Step 4.

### 6. Set Firestore Security Rules

1. In Firebase Console, go to **Firestore Database** → **Rules** tab
2. Replace with these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write only to authenticated users
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }

    match /teachers/{document=**} {
      allow read, write: if false;  // Teachers can't modify directly
    }

    match /students/{document=**} {
      allow read, write: if false;  // Students can't modify directly
    }
  }
}
```

3. Click **Publish**

### 7. Install Dependencies

```bash
npm install
# or
bun install
```

### 8. Run Development Server

```bash
npm run dev
# or
bun run dev
```

### 9. Access the App

Open http://localhost:5173/login

## First Time Use

### Create First Admin (Manual Setup in Firebase Console)

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Email: `admin@kodeshala.local`
4. Password: `admin123` (or any password)
5. Click **Add user**

### Add Admin Role in Firestore

1. Go to **Firestore Database** → Create collection called `users`
2. Create new document with ID matching the admin's Firebase UID
3. Add these fields:
   - `uid`: (copy from Firebase console)
   - `role`: `admin`
   - `name`: `Admin`
   - `loginId`: `admin`
   - `email`: `admin@kodeshala.local`
   - `createdAt`: (current timestamp)
   - `passwordUpdated`: `false`

### Login and Start

1. Go to http://localhost:5173/login
2. Login with:
   - Login ID: `admin`
   - Password: `admin123`

3. Now you can:
   - Add teachers
   - Add students
   - Manage accounts

## Firestore Collections Structure

The app automatically creates these when you add users:

```
/users/{uid}
  - uid: string
  - role: "admin" | "teacher" | "student"
  - name: string
  - loginId: string
  - email: string
  - grade?: string (for students only)
  - createdAt: timestamp
  - passwordUpdated: boolean

/teachers/{uid}
  - id: string
  - name: string
  - loginId: string
  - email: string
  - createdAt: timestamp

/students/{uid}
  - id: string
  - name: string
  - loginId: string
  - email: string
  - grade: string
  - createdAt: timestamp
```

## Troubleshooting

### "Cannot read properties of undefined"

- Make sure `.env.local` is created with all Firebase values
- Restart dev server after creating `.env.local`

### "Email already in use"

- Login IDs must be unique
- Use format: `firstname.lastname`

### Can't login

- Check exact login ID (case-sensitive from your input)
- Verify user exists in Firestore under `/users` collection
- Check console for specific error message

### "Permission denied" in console

- Update Firestore rules (may be in production mode)
- For development, use permissive rules temporarily

## Next Steps

1. ✅ Create admin account
2. ✅ Add some teachers
3. ✅ Add some students
4. Test login with teacher/student accounts
5. Change passwords from default
6. Deploy to production

---

**Need help?** Check ADMIN_SETUP.md for comprehensive documentation.
