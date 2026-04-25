import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from './config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { getCurrentSchool } from '@/config/schools';

export interface Teacher {
  id?: string;
  name: string;
  loginId: string;
  email: string;
  createdAt: Date;
}

export interface Student {
  id?: string;
  name: string;
  loginId: string;
  email: string;
  grade: string;
  createdAt: Date;
}

export interface UserProfile {
  uid: string;
  schoolId: string;
  role: 'admin' | 'teacher' | 'student';
  name: string;
  loginId: string;
  email: string;
  grade?: string;
  createdAt: Date;
  passwordUpdated: boolean;
}

export interface Admin {
  id?: string;
  name: string;
  loginId: string;
  email: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (loginId: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  addAdmin: (name: string, loginId: string) => Promise<void>;
  addTeacher: (name: string, loginId: string) => Promise<void>;
  addStudent: (name: string, loginId: string, grade: string) => Promise<void>;
  getAdmins: () => Promise<Admin[]>;
  getTeachers: () => Promise<Teacher[]>;
  getStudents: () => Promise<Student[]>;
  deleteAdmin: (id: string) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const savedCredentialsRef = useRef<{ loginId: string; password: string } | null>(null);
  const CREDENTIALS_KEY = 'har-school-gpt-admin-creds';
  const school = getCurrentSchool();

  useEffect(() => {
    const stored = sessionStorage.getItem(CREDENTIALS_KEY);
    if (stored) {
      try {
        savedCredentialsRef.current = JSON.parse(stored);
      } catch {
        savedCredentialsRef.current = null;
      }
    }
  }, []);

  // ✅ FIXED: NO "schools/" PREFIX
  const getDocRef = (collectionName: string, id: string) =>
    doc(db, collectionName, id);

  const getCollectionRef = (collectionName: string) =>
    collection(db, collectionName);

  const saveCredentials = (loginId: string, password: string) => {
    savedCredentialsRef.current = { loginId, password };
    sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ loginId, password }));
  };

  const clearSavedCredentials = () => {
    savedCredentialsRef.current = null;
    sessionStorage.removeItem(CREDENTIALS_KEY);
  };

  // ✅ AUTH STATE LISTENER
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const profileDoc = await getDoc(getDocRef('users', currentUser.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const normalizeEmail = (loginId: string) => {
    const normalized = loginId.trim().toLowerCase();

    if (!normalized) throw new Error('Login ID required');
    if (normalized.includes(' ')) throw new Error('No spaces allowed');

    if (normalized.includes('@')) return normalized;

    return `${normalized}@${school.id}.school.local`;
  };

  // ✅ FIXED LOGIN
  const login = async (loginId: string, password: string): Promise<UserProfile> => {
    const email = normalizeEmail(loginId);

    const result = await signInWithEmailAndPassword(auth, email, password);

    const profileDoc = await getDoc(getDocRef('users', result.user.uid));

    if (!profileDoc.exists()) {
      throw new Error('User profile not found in database');
    }

    const profile = profileDoc.data() as UserProfile;

    setUserProfile(profile);
    saveCredentials(loginId, password);

    return profile;
  };

  const logout = async () => {
    await signOut(auth);
    clearSavedCredentials();
    setUserProfile(null);
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!user) throw new Error('No user logged in');

    await updatePassword(user, newPassword);

    await setDoc(getDocRef('users', user.uid), {
      passwordUpdated: true,
    }, { merge: true });

    setUserProfile(prev => prev ? { ...prev, passwordUpdated: true } : null);
  };

  // ---------- CREATE USERS ----------

  const createUser = async (
    role: 'admin' | 'teacher' | 'student',
    name: string,
    loginId: string,
    grade?: string
  ) => {
    const email = normalizeEmail(loginId);
    const password = loginId;

    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

    const userData: {
      uid: string;
      schoolId: string;
      role: 'admin' | 'teacher' | 'student';
      name: string;
      loginId: string;
      email: string;
      grade?: string;
      createdAt: Date;
      passwordUpdated: boolean;
    } = {
      uid: newUser.uid,
      schoolId: school.id,
      role,
      name,
      loginId,
      email,
      createdAt: new Date(),
      passwordUpdated: false,
    };

    if (grade) {
      userData.grade = grade;
    }

    await setDoc(getDocRef('users', newUser.uid), userData);

    const adminCredentials = savedCredentialsRef.current;
    if (adminCredentials) {
      await login(adminCredentials.loginId, adminCredentials.password);
    }

    return newUser.uid;
  };

  const addAdmin = async (name: string, loginId: string) => {
    const id = await createUser('admin', name, loginId);
    await setDoc(getDocRef('admins', id), { id, name, loginId });
  };

  const addTeacher = async (name: string, loginId: string) => {
    const id = await createUser('teacher', name, loginId);
    await setDoc(getDocRef('teachers', id), { id, name, loginId });
  };

  const addStudent = async (name: string, loginId: string, grade: string) => {
    const id = await createUser('student', name, loginId, grade);
    await setDoc(getDocRef('students', id), { id, name, loginId, grade });
  };

  // ---------- FETCH ----------

  const getAdmins = async (): Promise<Admin[]> => {
    const snapshot = await getDocs(query(getCollectionRef('users'), where('role', '==', 'admin')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Admin[];
  };

  const getTeachers = async (): Promise<Teacher[]> => {
    const snapshot = await getDocs(query(getCollectionRef('users'), where('role', '==', 'teacher')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Teacher[];
  };

  const getStudents = async (): Promise<Student[]> => {
    const snapshot = await getDocs(query(getCollectionRef('users'), where('role', '==', 'student')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
  };

  // ---------- DELETE ----------

  const deleteAdmin = async (id: string) => {
    await Promise.all([
      deleteDoc(getDocRef('admins', id)),
      deleteDoc(getDocRef('users', id)),
    ]);
  };

  const deleteTeacher = async (id: string) => {
    await Promise.all([
      deleteDoc(getDocRef('teachers', id)),
      deleteDoc(getDocRef('users', id)),
    ]);
  };

  const deleteStudent = async (id: string) => {
    await Promise.all([
      deleteDoc(getDocRef('students', id)),
      deleteDoc(getDocRef('users', id)),
    ]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        login,
        logout,
        updateUserPassword,
        addAdmin,
        addTeacher,
        addStudent,
        getAdmins,
        getTeachers,
        getStudents,
        deleteAdmin,
        deleteTeacher,
        deleteStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}