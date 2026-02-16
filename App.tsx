import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Sessions from './components/Sessions';
import Payments from './components/Payments';
import Login from './components/Login';
import AuditLogs from './components/AuditLogs';
import Insights from './components/Insights';
import Communications from './components/Communications';
import { View, AppData } from './types';
import { supabase } from './services/supabaseClient';
import { dbService } from './services/dbService';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Settings from './components/Settings';
import LoadingScreen from './components/LoadingScreen';
import ResetPassword from './components/ResetPassword';
import ForgotPassword from './components/ForgotPassword';

const App: React.FC = () => {
  const { session, loading, isPasswordRecovery } = useAuth();
  const [activeView, setView] = useState<View>(() => {
    return (localStorage.getItem('activeView') as View) || 'dashboard';
  });
  const [preselectedStudentId, setPreselectedStudentId] = useState<string | null>(null);

  const handleSetView = (view: View, studentId?: string) => {
    if (studentId) {
      setPreselectedStudentId(studentId);
    } else {
      setPreselectedStudentId(null);
    }

    // Update the URL hash to trigger navigation
    window.location.hash = `#/${view}`;
    setView(view);
  };

  // Sync state with URL hash on load and on change
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '') as View;
      const validViews: View[] = ['dashboard', 'students', 'sessions', 'payments', 'logs', 'insights', 'communications', 'settings'];

      if (validViews.includes(hash) && hash !== activeView) {
        setView(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    // Initial sync
    const initialHash = window.location.hash.replace('#/', '') as View;
    const validViews: View[] = ['dashboard', 'students', 'sessions', 'payments', 'logs', 'insights', 'communications', 'settings'];
    if (validViews.includes(initialHash)) {
      setView(initialHash);
    } else if (!window.location.hash) {
      // Set default hash if none exists
      window.location.hash = `#/${activeView}`;
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('activeView', activeView);
  }, [activeView]);
  const [data, setData] = useState<AppData>({
    students: [],
    sessions: [],
    payments: [],
    loginHistory: [],
    emails: []
  });

  const refreshData = async () => {
    const newData = await dbService.getData();
    setData(newData);
  };

  const handleLogout = async () => {
    await dbService.recordLogin('logout');
    await supabase.auth.signOut();
    setView('dashboard');
  };

  useEffect(() => {
    if (session) refreshData();
  }, [session]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    if (isPasswordRecovery) {
      return <ResetPassword />;
    }
    if (activeView === 'forgot-password') {
      return <ForgotPassword onBack={() => handleSetView('dashboard')} />;
    }
    return <Login onLogin={() => { }} onForgotPassword={() => handleSetView('forgot-password')} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard data={data} onRefresh={refreshData} onNavigate={handleSetView} />;
      case 'students': return <Students data={data} onRefresh={refreshData} onEmailConnect={(id) => handleSetView('communications', id)} />;
      case 'sessions': return <Sessions data={data} onRefresh={refreshData} />;
      case 'payments': return <Payments data={data} onRefresh={refreshData} />;
      case 'communications': return <Communications data={data} onRefresh={refreshData} initialStudentId={preselectedStudentId} />;
      case 'insights': return <Insights data={data} />;
      case 'logs': return <AuditLogs data={data} />;
      case 'settings': return <Settings profile={data.tutorProfile} onProfileUpdate={refreshData} />;
      default: return <Dashboard data={data} onRefresh={refreshData} />;
    }
  };

  return (
    <ThemeProvider>
      <Layout activeView={activeView} setView={handleSetView} onLogout={handleLogout} profile={data.tutorProfile}>
        <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 md:py-10">
          {renderContent()}
        </main>
      </Layout>
    </ThemeProvider>
  );
};

export default App;
