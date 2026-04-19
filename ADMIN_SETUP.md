# Admin Panel Setup Guide

## System Overview

This admin panel allows administrators to:

- Add teachers with name and login ID
- Add students with name, login ID, and grade
- Manage teachers and students list
- Allow users to update passwords after first login

## Features

### 1. **Admin Dashboard**

- Add new teachers (name + login ID)
- Add new students (name + login ID + grade)
- View all teachers and students
- Copy login IDs with one click
- Delete users when needed

### 2. **Authentication System**

- Login with Login ID & Password
- Initial password = login ID
- Users can change password after first login
- Firebase Authentication backed

### 3. **User Roles**

- **Admin**: Can add/manage teachers and students
- **Teacher**: Can access teacher dashboard
- **Student**: Can access student dashboard

## Setup Instructions

### Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password authentication
4. Create Firestore Database:
   - Go to Firestore Database
   - Create a new database in production mode
5. Get your Firebase Config:
   - Project Settings → Your apps → Firebase SDK snippet
   - Copy the config values

### Step 2: Environment Setup

1. Install dependencies:

```bash
npm install
# or
bun install
```

2. Create a `.env.local` file in your project root:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 3: Firebase Firestore Rules

Set up proper security rules in Firestore. Replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId || request.auth.uid == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Only admins can access teachers and students
    match /teachers/{document=**} {
      allow read, write: if request.auth.uid != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /students/{document=**} {
      allow read, write: if request.auth.uid != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Step 4: Start the Application

```bash
npm run dev
# or
bun run dev
```

Visit `http://localhost:5173/login` to access the login page.

## Usage Flow

### For Admin (First Time Setup)

1. **Setup Admin Account**:
   - Manually create an admin account in Firebase Console (optional)
   - Or use email signup and manually set roles in Firestore

2. **Add Teachers**:
   - Login to Admin Dashboard
   - Click "Add Teacher" tab
   - Enter name and login ID (e.g., "john.smith")
   - System auto-generates:
     - Email: john.smith@kodeshala.local
     - Password: john.smith (same as login ID)
   - Share credentials with teacher

3. **Add Students**:
   - Click "Add Student" tab
   - Enter name, login ID, and grade
   - System auto-generates credentials
   - Share credentials with student

### For Teachers/Students (First Login)

1. **First Login**:
   - Visit `/login`
   - Enter Login ID and Password (same as login ID)
   - Click Login

2. **Change Password**:
   - After successful login
   - Look for "Change Password" button in profile
   - Set a new secure password

## Data Structure

### Firestore Collections

#### Users Collection

```
/users/{uid}
├── uid: string
├── role: "admin" | "teacher" | "student"
├── name: string
├── loginId: string
├── email: string
├── grade?: string (for students)
├── createdAt: timestamp
└── passwordUpdated: boolean
```

#### Teachers Collection

```
/teachers/{uid}
├── id: string
├── name: string
├── loginId: string
├── email: string
└── createdAt: timestamp
```

#### Students Collection

```
/students/{uid}
├── id: string
├── name: string
├── loginId: string
├── email: string
├── grade: string
└── createdAt: timestamp
```

## Login Credentials Format

- **Login ID**: lowercase, no spaces (e.g., "john.smith", "rahul.kumar")
- **App Email**: `{loginId}@kodeshala.local`
- **Initial Password**: Same as login ID

## Security Considerations

1. **Password Change**: Users should change their password immediately after first login
2. **Database Rules**: Only admins can manage teachers/students
3. **Email Format**: Uses custom domain to avoid confusion with real email addresses
4. **Validation**: All inputs are validated before creating accounts

## Troubleshooting

### "User not found" error during login

- Check the login ID is exactly as created
- Verify the user exists in Firestore

### "Email already in use" error

- Each login ID must be unique
- Use login ID format: firstname.lastname

### Unable to add teacher/student

- Ensure you're logged in as admin
- Check browser console for specific error
- Verify Firestore rules allow admin write access

## Firebase Console Quick Links

After setting up your project:

- Authentication Dashboard: `https://console.firebase.google.com/u/0/project/{PROJECT_ID}/authentication/users`
- Firestore Database: `https://console.firebase.google.com/u/0/project/{PROJECT_ID}/firestore/data`
- Project Settings: `https://console.firebase.google.com/u/0/project/{PROJECT_ID}/settings/general`

## Next Steps

1. Test the admin dashboard in development
2. Set up production Firebase project
3. Deploy the application
4. Train admins on usage
5. Onboard teachers and students
