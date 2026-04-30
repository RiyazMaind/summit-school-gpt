// ✅ FINAL STABLE AUTH CONTEXT (NO REDIRECT, NO SESSION SWITCH)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './config';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { getCurrentSchool } from '@/config/schools';

// ---------------- TYPES ----------------

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

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  studentName: string;
  grade: string;
  date: string;
  present: boolean;
  updatedAt: Date;
}

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;

  login: (loginId: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;

  addUser: (
    role: 'admin' | 'teacher' | 'student',
    name: string,
    loginId: string,
    grade?: string
  ) => Promise<void>;

  getUsersByRole: (role: 'admin' | 'teacher' | 'student') => Promise<UserProfile[]>;
  deleteUser: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------- PROVIDER ----------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const school = getCurrentSchool();

  const docRef = (col: string, id: string) =>
    doc(db, 'schools', school.id, col, id);

  const colRef = (col: string) =>
    collection(db, 'schools', school.id, col);

  const normalizeEmail = (loginId: string) => {
    return `${loginId}@${school.id}.school.local`;
  };

  // ---------- LOGIN (CUSTOM) ----------

  const login = async (loginId: string, password: string) => {
    setLoading(true);

    const snap = await getDocs(
      query(colRef('users'), where('loginId', '==', loginId))
    );

    if (snap.empty) {
      setLoading(false);
      throw new Error("User not found");
    }

    const profile = snap.docs[0].data() as UserProfile;

    // ⚠️ simple password check (same as loginId)
    if (password !== loginId) {
      setLoading(false);
      throw new Error("Invalid password");
    }

    setUserProfile(profile);
    setLoading(false);

    return profile;
  };

  const logout = async () => {
    setUserProfile(null);
  };

  // ---------- CREATE USER (NO AUTH SWITCH) ----------

  const addUser = async (
    role: 'admin' | 'teacher' | 'student',
    name: string,
    loginId: string,
    grade?: string
  ) => {
    const uid = crypto.randomUUID();

    const data: any = {
      uid,
      schoolId: school.id,
      role,
      name,
      loginId,
      email: normalizeEmail(loginId),
      createdAt: new Date(),
      passwordUpdated: false,
    };

    if (grade) data.grade = grade;

    await setDoc(docRef('users', uid), data);
  };

  // ---------- FETCH USERS ----------

  const getUsersByRole = async (role: 'admin' | 'teacher' | 'student') => {
    const snap = await getDocs(
      query(colRef('users'), where('role', '==', role))
    );
    return snap.docs.map(d => ({ ...d.data(), uid: d.id })) as UserProfile[];
  };

  // ---------- DELETE ----------

  const deleteUser = async (id: string) => {
    await deleteDoc(docRef('users', id));
  };

  return (
    <AuthContext.Provider value={{
      userProfile,
      loading,
      login,
      logout,
      addUser,
      getUsersByRole,
      deleteUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------- HOOK ----------

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}