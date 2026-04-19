import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from './config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';

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
  role: 'admin' | 'teacher' | 'student';
  name: string;
  loginId: string;
  email: string;
  grade?: string;
  createdAt: Date;
  passwordUpdated: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  addTeacher: (name: string, loginId: string) => Promise<void>;
  addStudent: (name: string, loginId: string, grade: string) => Promise<void>;
  getTeachers: () => Promise<Teacher[]>;
  getStudents: () => Promise<Student[]>;
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

  const loadSavedCredentials = () => {
    try {
      const raw = sessionStorage.getItem(CREDENTIALS_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as { loginId: string; password: string };
    } catch {
      return null;
    }
  };

  const saveCredentials = (loginId: string, password: string) => {
    savedCredentialsRef.current = { loginId, password };
    sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ loginId, password }));
  };

  const clearSavedCredentials = () => {
    savedCredentialsRef.current = null;
    sessionStorage.removeItem(CREDENTIALS_KEY);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data() as UserProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
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
    if (!normalized) {
      throw new Error('Login ID is required');
    }
    if (normalized.includes(' ')) {
      throw new Error('Login ID cannot contain spaces');
    }
    if (normalized.includes('@')) {
      return normalized;
    }
    return `${normalized}@kodeshala.local`;
  };

  const getSavedCredentials = () => {
    return savedCredentialsRef.current || loadSavedCredentials();
  };

  const login = async (loginId: string, password: string) => {
    try {
      const email = normalizeEmail(loginId);
      await signInWithEmailAndPassword(auth, email, password);
      saveCredentials(loginId, password);
    } catch (error) {
      throw error;
    }
  };

  const restorePreviousUser = async () => {
    const saved = getSavedCredentials();
    if (!saved) return null;

    const signInResult = await signInWithEmailAndPassword(
      auth,
      normalizeEmail(saved.loginId),
      saved.password
    );

    const profileDoc = await getDoc(doc(db, 'users', signInResult.user.uid));
    if (profileDoc.exists()) {
      setUserProfile(profileDoc.data() as UserProfile);
    }

    return signInResult.user;
  };

  const logout = async () => {
    try {
      await signOut(auth);
      clearSavedCredentials();
      setUserProfile(null);
    } catch (error) {
      throw error;
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    try {
      if (!user) throw new Error('No user logged in');
      await updatePassword(user, newPassword);
      // Update the passwordUpdated flag in Firestore
      await setDoc(
        doc(db, 'users', user.uid),
        { passwordUpdated: true },
        { merge: true }
      );
      setUserProfile((prev) => (prev ? { ...prev, passwordUpdated: true } : null));
    } catch (error) {
      throw error;
    }
  };

  const addTeacher = async (name: string, loginId: string) => {
    try {
      const email = normalizeEmail(loginId);
      const password = loginId; // Initial password same as login id
      const previousUser = auth.currentUser?.uid;
      const previousCredentials = getSavedCredentials();

      if (!previousCredentials) {
        throw new Error('Unable to restore admin session. Please log in again before creating users.');
      }

      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        role: 'teacher',
        name,
        loginId,
        email,
        createdAt: new Date(),
        passwordUpdated: false,
      });
      await setDoc(doc(db, 'teachers', newUser.uid), {
        id: newUser.uid,
        name,
        loginId,
        email,
        createdAt: new Date(),
      });

      if (previousUser && auth.currentUser?.uid !== previousUser) {
        await restorePreviousUser();
      }
    } catch (error) {
      throw error;
    }
  };

  const addStudent = async (name: string, loginId: string, grade: string) => {
    try {
      const email = normalizeEmail(loginId);
      const password = loginId; // Initial password same as login id
      const previousUser = auth.currentUser?.uid;
      const previousCredentials = getSavedCredentials();

      if (!previousCredentials) {
        throw new Error('Unable to restore admin session. Please log in again before creating users.');
      }

      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        role: 'student',
        name,
        loginId,
        email,
        grade,
        createdAt: new Date(),
        passwordUpdated: false,
      });
      await setDoc(doc(db, 'students', newUser.uid), {
        id: newUser.uid,
        name,
        loginId,
        email,
        grade,
        createdAt: new Date(),
      });

      if (previousUser && auth.currentUser?.uid !== previousUser) {
        await restorePreviousUser();
      }
    } catch (error) {
      throw error;
    }
  };

  const getTeachers = async (): Promise<Teacher[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));

    const teachers = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((user: any) => user.role === "teacher");

    console.log("Filtered teachers:", teachers);

    return teachers as Teacher[];
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return [];
  }
};

  const getStudents = async (): Promise<Student[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      loginId: doc.data().loginId,
      email: doc.data().email,
      grade: doc.data().grade,
      createdAt: doc.data().createdAt,
    })) as Student[];
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

  const deleteTeacher = async (id: string) => {
    try {
      await Promise.all([
        deleteDoc(doc(db, 'teachers', id)),
        deleteDoc(doc(db, 'users', id)),
      ]);
    } catch (error) {
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      await Promise.all([
        deleteDoc(doc(db, 'students', id)),
        deleteDoc(doc(db, 'users', id)),
      ]);
    } catch (error) {
      throw error;
    }
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
        addTeacher,
        addStudent,
        getTeachers,
        getStudents,
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
