# 🚀 Quick Start Guide - Admin Panel

## In 3 Steps (30 minutes)

### Step 1: Firebase Setup (10 min)

```
1. Go to https://console.firebase.google.com
2. Create project "Kodeshala"
3. Enable Authentication → Email/Password
4. Create Firestore Database (Production mode)
5. Get config from Project Settings
```

### Step 2: Configure App (10 min)

```bash
# Install packages
npm install
# or
bun install

# Create .env.local and add:
VITE_FIREBASE_API_KEY=your_value
VITE_FIREBASE_AUTH_DOMAIN=your_value
VITE_FIREBASE_PROJECT_ID=your_value
VITE_FIREBASE_STORAGE_BUCKET=your_value
VITE_FIREBASE_MESSAGING_SENDER_ID=your_value
VITE_FIREBASE_APP_ID=your_value
```

### Step 3: Run & Test (10 min)

```bash
npm run dev
# Open http://localhost:5173/login

# You'll need to manually create first admin in Firebase Console
# Then add admin role in Firestore
```

## What Works Now?

### Admin Can Do

✅ Add teachers (name + login ID)  
✅ Add students (name + login ID + grade)  
✅ View all teachers and students  
✅ Copy login IDs with one click  
✅ Delete users  
✅ Change password  
✅ Logout

### Login Works With

- Login ID (e.g., "john.smith")
- Password (initially same as login ID)
- Auto-redirect to role dashboard
- Change password after login

### Database Structure

```
users/
  - All user profiles with roles

teachers/
  - Teacher records

students/
  - Student records with grades
```

## Login Flow

1. Go to `/login`
2. Enter Login ID & Password
3. System finds user by login ID
4. Maps to auto-generated email: `{loginId}@kodeshala.local`
5. Authenticates with Firebase
6. Redirects to dashboard based on role

## Initial Setup (First Time Only)

### Create First Admin Manually

```
1. Firebase Console → Authentication → Users
2. Click "Add user"
3. Email: admin@kodeshala.local
4. Password: admin123
5. Copy the UID shown

6. Go to Firestore → Create collection "users"
7. Create document with ID = admin's UID
8. Add fields:
   uid: (copy from step 5)
   role: "admin"
   name: "Admin"
   loginId: "admin"
   email: "admin@kodeshala.local"
   createdAt: (timestamp)
   passwordUpdated: false
```

After that, admin can:

- Login with ID "admin" / Password "admin123"
- Add teachers and students from dashboard
- Those users can then login

## Common Login IDs Format

```
john.smith        → Email: john.smith@kodeshala.local
rahul.kumar       → Email: rahul.kumar@kodeshala.local
priya.patel       → Email: priya.patel@kodeshala.local
```

## Firestore Security (Copy-Paste)

In Firestore → Rules → Replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
    match /teachers/{document=**} {
      allow read, write: if false;
    }
    match /students/{document=**} {
      allow read, write: if false;
    }
  }
}
```

Then click "Publish"

## Files You Modified

**New Files:**

- `src/integrations/firebase/config.ts` - Firebase setup
- `src/integrations/firebase/auth-context.tsx` - Auth logic
- `src/components/PasswordUpdateDialog.tsx` - Password change
- `.env.example` - Environment template
- 4 documentation files

**Updated Files:**

- `package.json` - Added firebase
- `src/App.tsx` - Added AuthProvider
- `src/pages/Login.tsx` - Rewrote with Firebase
- `src/pages/AdminDashboard.tsx` - Complete rewrite
- `src/pages/StudentDashboard.tsx` - Added logout buttons
- `src/pages/TeacherDashboard.tsx` - Added logout buttons

## Test Checklist

After setup, test:

- [ ] Admin login works
- [ ] Can add teacher with name & login ID
- [ ] Can add student with name, login ID & grade
- [ ] Teachers list shows all teachers
- [ ] Students list shows all students with grades
- [ ] Can copy login ID to clipboard
- [ ] Teacher can login
- [ ] Student can login
- [ ] Can change password
- [ ] Logout works

## Troubleshooting

| Issue                           | Solution                                                    |
| ------------------------------- | ----------------------------------------------------------- |
| "Cannot find module 'firebase'" | Run `npm install` or `bun install`                          |
| "Firebase config undefined"     | Create `.env.local` with all 6 values and restart server    |
| "User not found"                | Check loginId exists in Firestore `/users` collection       |
| "Login fails"                   | Verify email format is correct: `{loginId}@kodeshala.local` |
| "Permission denied"             | Update Firestore rules as shown above                       |

## Next: Read These Docs

1. **FIREBASE_QUICKSTART.md** - Detailed Firebase setup
2. **ADMIN_SETUP.md** - Complete features guide
3. **SYSTEM_OVERVIEW.md** - Architecture details

## Support

All documentation files included:

- `SYSTEM_OVERVIEW.md` - Full architecture
- `ADMIN_SETUP.md` - Comprehensive guide
- `FIREBASE_QUICKSTART.md` - Firebase setup
- `IMPLEMENTATION_CHECKLIST.md` - Verification

---

**Status**: ✅ Ready for Firebase integration

**Next Step**: Copy your Firebase config to `.env.local` and run `npm run dev`
