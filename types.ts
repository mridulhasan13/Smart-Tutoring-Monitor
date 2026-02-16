
export interface TutorProfile {
  name: string;
  email: string;
  profession: string;
  institution: string; // Kept for backward compatibility or generic use
  school?: string;
  college?: string;
  university: string;
  level?: string;      // 1-4
  term?: string;       // 1-2
  city?: string;
  contactNumber?: string;
  yearTerm: string;    // Kept for backward compatibility or display
  avatarUrl?: string;
}

export interface Student {
  id: string;
  name: string; // Group Name or Student Name
  phone: string;
  email: string; // Added email field for students
  subject: 'Math' | 'Physics' | 'Chemistry' | 'Biology' | string;
  grade: string;
  monthlyPayment: number;
  isGroup: boolean;
  groupSize: number;
  groupMembers?: string[];
  color: string;
  whatsappGroupUrl?: string;
  // New Fields
  classLevel?: string; // Replaces grade if needed, or alias
  gender?: 'Male' | 'Female' | 'Other';
  guardianPhone?: string;
  whatsappGroup?: string; // Number or Link
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  groupData?: Student[]; // Recursive for batch, or just flattened data
  institution?: string;
  targetSessions?: number; // Monthly target (default 12)
  createdAt: string;
}

export interface Session {
  id: string;
  studentId?: string; // Optional for archived/deleted student references
  studentName?: string; // Snapshotted name for persistence
  date: string; // ISO string
  startTime: string; // ISO string
  endTime?: string; // ISO string
  duration: number; // minutes
  status: 'completed' | 'scheduled' | 'cancelled' | 'in-progress';
  subjectTaught: string;
  notes?: string;
}

export interface Payment {
  id: string;
  studentId?: string; // Optional for archived/deleted student references
  studentName?: string; // Snapshotted name for persistence
  amount: number;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  reference?: string;
  month?: string;
  notes?: string; // Additional comments
}

export interface Email {
  id: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  status: 'dispatched' | 'delivered';
}

export interface LoginRecord {
  id: string;
  timestamp: string;
  action: 'login' | 'logout';
}

export interface AppData {
  tutorProfile?: TutorProfile;
  students: Student[];
  sessions: Session[];
  payments: Payment[];
  loginHistory: LoginRecord[];
  emails: Email[]; // Added email log history
}

export type View = 'dashboard' | 'students' | 'sessions' | 'payments' | 'logs' | 'insights' | 'communications' | 'settings' | 'forgot-password';
