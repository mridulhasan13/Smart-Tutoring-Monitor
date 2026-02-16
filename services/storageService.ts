
import { AppData, Student, Session, Payment, LoginRecord, TutorProfile, Email } from '../types';

const STORAGE_KEY = 'smart_tutor_core_data';

const initialData: AppData = {
  students: [],
  sessions: [],
  payments: [],
  loginHistory: [],
  emails: []
};

export const storageService = {
  getData: (): AppData => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : initialData;
  },

  saveData: (data: AppData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  setTutorProfile: (profile: TutorProfile) => {
    const data = storageService.getData();
    data.tutorProfile = profile;
    storageService.saveData(data);
  },

  recordLogin: () => {
    const data = storageService.getData();
    const newRecord: LoginRecord = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action: 'login'
    };
    data.loginHistory = [newRecord, ...(data.loginHistory || [])];
    storageService.saveData(data);
  },

  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => {
    const data = storageService.getData();
    const newStudent: Student = {
      ...student,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    data.students.push(newStudent);
    storageService.saveData(data);
    return newStudent;
  },

  addSession: (session: Omit<Session, 'id'>) => {
    const data = storageService.getData();
    const newSession: Session = {
      ...session,
      id: Math.random().toString(36).substr(2, 9)
    };
    data.sessions.push(newSession);
    storageService.saveData(data);
    return newSession;
  },

  updateSession: (id: string, updates: Partial<Session>) => {
    const data = storageService.getData();
    const index = data.sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      data.sessions[index] = { ...data.sessions[index], ...updates };
      storageService.saveData(data);
    }
  },

  addPayment: (payment: Omit<Payment, 'id'>) => {
    const data = storageService.getData();
    const newPayment: Payment = {
      ...payment,
      id: Math.random().toString(36).substr(2, 9)
    };
    data.payments.push(newPayment);
    storageService.saveData(data);
    return newPayment;
  },

  logEmail: (email: Omit<Email, 'id' | 'timestamp' | 'status'>) => {
    const data = storageService.getData();
    const newEmail: Email = {
      ...email,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      status: 'dispatched'
    };
    if (!data.emails) data.emails = [];
    data.emails = [newEmail, ...data.emails];
    storageService.saveData(data);
    return newEmail;
  },

  deleteStudent: (id: string) => {
    const data = storageService.getData();
    data.students = data.students.filter(s => s.id !== id);
    data.sessions = data.sessions.filter(s => s.studentId !== id);
    data.payments = data.payments.filter(p => p.studentId !== id);
    storageService.saveData(data);
  },
  
  updatePaymentStatus: (id: string, status: Payment['status']) => {
    const data = storageService.getData();
    const payment = data.payments.find(p => p.id === id);
    if (payment) {
      payment.status = status;
      storageService.saveData(data);
    }
  }
};
