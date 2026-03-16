
"use client";

// This is a simulation layer for Firebase to demonstrate the UI flow.
// In a real app, this would use the firebase/app and firebase/firestore SDKs.

export type UserRole = 'Admin' | 'Visitor';

export interface User {
  uid: string;
  name: string;
  schoolId: string;
  email: string;
  college: string;
  is_blocked: boolean;
  role: UserRole;
}

export interface VisitLog {
  id: string;
  userId: string;
  userName: string;
  userCollege: string;
  timestamp: string;
  purpose: 'Reading Books' | 'Research in Thesis' | 'Use of Computer' | 'Doing Assignments';
}

const MOCK_USERS: User[] = [
  {
    uid: 'v1',
    name: 'John Doe',
    schoolId: 'RFID-12345',
    email: 'j.doe@neu.edu.ph',
    college: 'College of Computing',
    is_blocked: false,
    role: 'Visitor',
  },
  {
    uid: 'v2',
    name: 'Jane Smith',
    schoolId: 'RFID-67890',
    email: 'j.smith@neu.edu.ph',
    college: 'College of Arts and Sciences',
    is_blocked: true,
    role: 'Visitor',
  },
  {
    uid: 'a1',
    name: 'Admin User',
    schoolId: 'ADMIN-001',
    email: 'admin@neu.edu.ph',
    college: 'Library Office',
    is_blocked: false,
    role: 'Admin',
  }
];

let MOCK_LOGS: VisitLog[] = [
  {
    id: 'l1',
    userId: 'v1',
    userName: 'John Doe',
    userCollege: 'College of Computing',
    timestamp: new Date().toISOString(),
    purpose: 'Reading Books',
  }
];

export const firebaseService = {
  findUserByIdOrEmail: async (input: string): Promise<User | null> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    const user = MOCK_USERS.find(u => u.schoolId === input || u.email === input);
    return user || null;
  },

  addVisitLog: async (log: Omit<VisitLog, 'id'>) => {
    await new Promise(r => setTimeout(r, 500));
    const newLog = { ...log, id: Math.random().toString(36).substr(2, 9) };
    MOCK_LOGS.push(newLog);
    return newLog;
  },

  getAllLogs: async (): Promise<VisitLog[]> => {
    return [...MOCK_LOGS].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  getUsers: async (): Promise<User[]> => {
    return [...MOCK_USERS];
  },

  toggleUserBlock: async (uid: string) => {
    const user = MOCK_USERS.find(u => u.uid === uid);
    if (user) {
      user.is_blocked = !user.is_blocked;
    }
    return user;
  }
};
