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
  assignedGrade?: string;
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

  updateUser: (id: string, updates: Partial<Pick<UserProfile, 'assignedGrade' | 'grade' | 'name'>>) => Promise<void>;
  checkLoginIdExists: (loginId: string) => Promise<boolean>;
  getUsersByRole: (role: 'admin' | 'teacher' | 'student') => Promise<UserProfile[]>;
  getStudentsByGrade: (grade: string) => Promise<UserProfile[]>;
  getAttendanceRecords: (grade: string, date: string) => Promise<AttendanceRecord[]>;
  getAttendanceAnalytics: (grade: string) => Promise<AttendanceRecord[]>;
  getAllAttendanceRecords: () => Promise<AttendanceRecord[]>;
  saveAttendanceRecords: (grade: string, date: string, records: AttendanceRecord[]) => Promise<void>;
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

  const attendanceCollection = () =>
    collection(db, 'schools', school.id, 'attendance');

  const attendanceDocRef = (id: string) =>
    doc(db, 'schools', school.id, 'attendance', id);

  const attendanceId = (grade: string, date: string, studentId: string) =>
    `${grade}-${date}-${studentId}`;

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

  const checkLoginIdExists = async (loginId: string) => {
    const snap = await getDocs(
      query(colRef('users'), where('loginId', '==', loginId))
    );
    return !snap.empty;
  };

  const updateUser = async (
    id: string,
    updates: Partial<Pick<UserProfile, 'assignedGrade' | 'grade' | 'name'>>
  ) => {
    await setDoc(docRef('users', id), updates, { merge: true });
  };

  const getStudentsByGrade = async (grade: string) => {
    const snap = await getDocs(
      query(colRef('users'), where('role', '==', 'student'), where('grade', '==', grade))
    );
    return snap.docs.map(d => ({ ...d.data(), uid: d.id })) as UserProfile[];
  };

  const getAttendanceRecords = async (grade: string, date: string) => {
    const snap = await getDocs(
      query(
        attendanceCollection(),
        where('grade', '==', grade),
        where('date', '==', date)
      )
    );
    return snap.docs.map(d => ({ ...(d.data() as AttendanceRecord), id: d.id }));
  };

  const getAttendanceAnalytics = async (grade: string) => {
    const snap = await getDocs(
      query(attendanceCollection(), where('grade', '==', grade))
    );
    return snap.docs.map(d => ({ ...(d.data() as AttendanceRecord), id: d.id }));
  };

  const getAllAttendanceRecords = async () => {
    const snap = await getDocs(attendanceCollection());
    return snap.docs.map(d => ({ ...(d.data() as AttendanceRecord), id: d.id }));
  };

  const saveAttendanceRecords = async (
    grade: string,
    date: string,
    records: AttendanceRecord[]
  ) => {
    await Promise.all(
      records.map((record) =>
        setDoc(attendanceDocRef(attendanceId(grade, date, record.studentId)), {
          studentId: record.studentId,
          studentName: record.studentName,
          grade,
          date,
          present: record.present,
          updatedAt: record.updatedAt,
        })
      )
    );
  };

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
      updateUser,
      checkLoginIdExists,
      getUsersByRole,
      getStudentsByGrade,
      getAttendanceRecords,
      getAttendanceAnalytics,
      getAllAttendanceRecords,
      saveAttendanceRecords,
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