
import React, { useState, useMemo, useEffect } from 'react';
import { AppData, Session } from '../types';
import { dbService } from '../services/dbService';

import TimeEarningsChart from './TimeEarningsChart';

interface DashboardProps {
  data: AppData;
  onRefresh: () => void;
  onNavigate?: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onRefresh, onNavigate }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('Math');
  const [activeSession, setActiveSession] = useState<Session | null>(
    data.sessions.find(s => s.status === 'in-progress') || null
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'online' | 'offline'>('syncing');
  const [now, setNow] = useState(new Date());
  const [timeOffset, setTimeOffset] = useState(0); // Offset in ms from server time
  const [isClosing, setIsClosing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Audio Ref for background persistence
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const syncTime = async () => {
      try {
        const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Dhaka');
        if (response.ok) {
          const data = await response.json();
          const serverTime = new Date(data.datetime).getTime();
          const localTime = new Date().getTime();
          setTimeOffset(serverTime - localTime);
          setSyncStatus('online');
        } else {
          setSyncStatus('offline');
        }
      } catch (err) {
        console.warn("Time sync failed, using local time:", err);
        setSyncStatus('offline');
      }
    };

    syncTime();

    // Auto-sync when internet returns
    window.addEventListener('online', syncTime);

    // Periodic sync attempt (every 10 mins)
    const syncInterval = setInterval(syncTime, 10 * 60 * 1000);

    const clockInterval = setInterval(() => setNow(new Date()), 1000);

    return () => {
      window.removeEventListener('online', syncTime);
      clearInterval(syncInterval);
      clearInterval(clockInterval);
    };
  }, []);

  // Sync active session when data loads
  useEffect(() => {
    const current = data.sessions.find(s => s.status === 'in-progress');
    if (current && !activeSession) {
      setActiveSession(current);
    }
  }, [data.sessions]);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession) {
      // Initialize with correct difference immediately to avoid 1s delay or 0s flash
      const updateTimer = () => {
        const startTimeStr = activeSession.startTime;
        if (!startTimeStr) {
          setElapsedSeconds(0);
          return;
        }

        // Ensure robust parsing (handle possible space instead of T from some DB returns)
        const normalizeISO = (str: string) => str.replace(' ', 'T');
        const start = new Date(normalizeISO(startTimeStr)).getTime();

        if (isNaN(start)) {
          setElapsedSeconds(0);
          return;
        }

        const currentLocal = new Date().getTime();
        setElapsedSeconds(Math.max(0, Math.floor((currentLocal - start) / 1000)));
      };

      updateTimer(); // Run once immediately
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTime = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "0m 00s";
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const reminders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return data.sessions.filter(s => s.date === today && s.status === 'scheduled');
  }, [data.sessions]);

  // Initialize Audio Element
  useEffect(() => {
    // Lazy load the silent audio utility
    import('../utils/silentAudio').then(({ createSilentAudio }) => {
      const audio = new Audio(createSilentAudio());
      audio.loop = true;
      audioRef.current = audio;
    });

    // Request Notification Permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const updateMediaSession = (studentName: string) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Active Tutoring Session',
        artist: studentName,
        album: 'Smart Tutoring Portal',
        artwork: [
          { src: 'https://via.placeholder.com/512?text=Tutoring', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        // "Pause" on lock screen means "Stop Session" here
        endTutoring();
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        endTutoring();
      });
    }
  };

  const clearMediaSession = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('stop', null);
    }
  };


  const startTutoring = async (studentId: string) => {
    if (isStarting) return;
    setIsStarting(true);
    const now = new Date();
    const student = data.students.find(s => s.id === studentId);

    try {
      // 1. Start Background Audio (Must be triggered by user interaction)
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
      }

      // 2. Set Lock Screen Controls
      if (student) {
        updateMediaSession(student.name);

        // 3. Fire Notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Session Started', {
            body: `Tracking started for ${student.name}`,
            icon: '/vite.svg' // specific icon if available
          });
        }
      }

      const newSession: Omit<Session, 'id'> = {
        studentId,
        date: now.toISOString().split('T')[0],
        startTime: now.toISOString(),
        duration: 0,
        status: 'in-progress',
        subjectTaught: selectedSubject,
        notes: ''
      };

      // Optimistic Update
      const optimisticSession = { ...newSession, id: 'temp-' + Date.now() };
      setActiveSession(optimisticSession as Session);

      const saved = await dbService.addSession(newSession);
      setActiveSession(saved);
      await onRefresh();
    } catch (error: any) {
      console.error("Failed to start session:", error);
      alert(`Could not start session: ${error.message || 'Unknown error'}. Please try again.`);
      setActiveSession(null);
      if (audioRef.current) audioRef.current.pause();
      clearMediaSession();
    } finally {
      setIsStarting(false);
    }
  };

  const endTutoring = async () => {
    await performSessionEnd();
  };

  // Ref for active session ID to ensure lock screen handler has access to latest
  const activeSessionIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    activeSessionIdRef.current = activeSession?.id || null;

    // If we reload and have active session, ensure audio/media session is restored?
    if (activeSession && !audioRef.current?.paused) {
      // It's tricky to auto-play audio without interaction on reload.
      // But if we just navigating, the audio element might persist if preserved? No.
      // If user refreshes, background audio stops. We can't auto-restart it easily.
      // We accept that refresh kills the background capability until they click something?
      // Or we show a "Resume Background" button.
      // For now, basic flow.
      const s = data.students.find(st => st.id === activeSession.studentId);
      if (s) updateMediaSession(s.name);
    }
  }, [activeSession]);

  const performSessionEnd = async () => {
    if (isClosing) return;
    setIsClosing(true);

    try {
      const idToClose = activeSessionIdRef.current;
      if (!idToClose) {
        setIsClosing(false);
        return;
      }

      // Stop Audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      clearMediaSession();

      const sessionToEnd = data.sessions.find(s => s.id === idToClose);
      if (!sessionToEnd) {
        setIsClosing(false);
        return;
      }

      const end = new Date();
      const start = new Date(sessionToEnd.startTime);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.max(1, Math.round(diffMs / 60000));

      await dbService.updateSession(idToClose, {
        endTime: end.toISOString(),
        duration: diffMins,
        status: 'completed'
      });

      setActiveSession(null);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Session Ended', {
          body: `Session completed. Duration: ${diffMins} mins.`,
          icon: '/vite.svg'
        });
      }

      await onRefresh();
    } catch (error) {
      console.error("Failed to end session:", error);
      alert("Failed to save session. Please try again.");
    } finally {
      setIsClosing(false);
    }
  };





  const synchronizedNow = new Date(now.getTime() + timeOffset);

  const currentTimeStr = synchronizedNow.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Dhaka'
  });

  const currentDateStr = synchronizedNow.toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka'
  });

  return (
    <div className="space-y-4 md:space-y-10 animate-in fade-in duration-500 pb-20">

      {/* 1. Sync Header & Profile */}
      <section className="bg-[#020617] rounded-3xl md:rounded-[3rem] p-4 md:p-10 text-white relative overflow-hidden shadow-2xl border border-blue-900/20">
        <div className="absolute top-0 right-0 p-12 bg-blue-500/10 blur-3xl w-80 h-80 rounded-full"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-4 md:gap-10">
          <div className="w-16 h-16 md:w-32 md:h-32 rounded-2xl md:rounded-[2.5rem] bg-blue-600 flex items-center justify-center text-white text-2xl md:text-5xl font-black shadow-2xl shadow-blue-500/20 shrink-0 border border-blue-400/30 overflow-hidden relative group">
            {data.tutorProfile?.avatarUrl ? (
              <img src={data.tutorProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              data.tutorProfile?.name?.charAt(0) || data.tutorProfile?.email?.charAt(0) || 'U'
            )}
            <button
              onClick={() => onNavigate?.('settings')}
              className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold uppercase tracking-widest cursor-pointer"
            >
              <i className="fas fa-camera mr-2"></i> Edit
            </button>
          </div>
          <div className="flex-1 text-center lg:text-left space-y-2 md:space-y-4">
            <div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">{data.tutorProfile?.name || data.tutorProfile?.email?.split('@')[0] || 'User'}</h2>
                <button
                  onClick={() => onNavigate?.('settings')}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] md:text-xs text-blue-400 transition-all"
                  title="Edit Profile"
                >
                  <i className="fas fa-pencil-alt"></i>
                </button>
              </div>
              <p className="text-blue-400 font-black text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.5em] mt-0.5">{data.tutorProfile?.email}</p>
            </div>
            <div className="flex flex-wrap justify-center lg:justify-start gap-y-2 gap-x-4 pt-2 md:pt-4 border-t border-white/5">
              <span className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <i className="fas fa-university text-blue-500"></i> {data.tutorProfile?.university || 'N/A'}
              </span>
              <span className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <i className="fas fa-location-dot text-blue-500"></i> {data.tutorProfile?.city || 'N/A'}
              </span>
              <span className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <i className="fas fa-layer-group text-blue-500"></i> {data.tutorProfile?.level ? `L-${data.tutorProfile.level}` : 'L-?'} - {data.tutorProfile?.term ? `T-${data.tutorProfile.term}` : 'T-?'}
              </span>
            </div>
          </div>
          <div className="shrink-0 w-full lg:w-auto bg-white/5 backdrop-blur-md px-6 md:px-10 py-4 md:py-8 rounded-2xl md:rounded-[2.5rem] border border-white/10 text-center shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex items-center justify-center gap-2 mb-3 md:mb-6 pb-2 md:pb-4 border-b border-white/10">
              <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'online' ? 'bg-green-500' : syncStatus === 'offline' ? 'bg-amber-500' : 'bg-blue-400 animate-pulse'}`}></div>
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                {syncStatus === 'online' ? 'Global NTP Sync' : syncStatus === 'offline' ? 'Local Quartz (Offline)' : 'Synchronizing...'}
              </span>
            </div>

            <p className="text-blue-400 font-black text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] mb-0.5">Dhaka Local Time</p>
            <p className="text-2xl md:text-4xl font-mono font-black text-white leading-none">{currentTimeStr}</p>
            <p className="text-[8px] md:text-[10px] font-black text-slate-500 mt-1.5 uppercase tracking-widest">{currentDateStr}</p>
          </div>
        </div>
      </section>

      {/* 2. Reminders & Alerts */}
      {reminders.length > 0 && (
        <section className="animate-in slide-in-from-top duration-500">
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 flex items-center gap-4 md:gap-6 shadow-lg shadow-rose-100/50 dark:shadow-rose-900/10">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-rose-500 text-white flex items-center justify-center text-base md:text-xl shadow-lg shadow-rose-500/20">
              <i className="fas fa-bell animate-bounce"></i>
            </div>
            <div className="flex-1">
              <h4 className="text-rose-900 dark:text-rose-100 font-black uppercase tracking-tight text-sm md:text-lg">Tuition Reminder</h4>
              <p className="text-rose-600/80 dark:text-rose-300 text-[10px] md:text-sm font-bold">{reminders.length} session(s) today.</p>
            </div>
            <div className="flex gap-2">
              {reminders.map(r => (
                <div key={r.id} className="px-2 md:px-4 py-1.5 md:py-2 bg-white dark:bg-rose-900/40 rounded-lg md:rounded-xl border border-rose-200 dark:border-rose-800 text-[8px] md:text-[10px] font-black text-rose-900 dark:text-rose-100 uppercase">
                  {data.students.find(s => s.id === r.studentId)?.name.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Live Tuition Monitor */}
      <section className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl md:rounded-[3rem] p-4 md:p-10 border border-slate-200 dark:border-slate-700/50 pro-shadow">
        <div className="flex flex-col xl:flex-row items-center gap-4 md:gap-12">
          <div className="w-full text-center xl:text-left">
            <h3 className="text-xl md:text-2xl font-black text-[#020617] dark:text-white uppercase tracking-tighter mb-1">Tuition Monitor</h3>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-medium">Log your sessions with precision.</p>
          </div>

          <div
            className={`w-full p-4 md:p-10 rounded-2xl md:rounded-[3rem] border-2 transition-all flex flex-col md:flex-row items-center gap-4 md:gap-10 relative overflow-hidden`}
            style={{
              backgroundColor: activeSession ? (data.students.find(s => s.id === activeSession.studentId)?.color + '10') : '',
              borderColor: activeSession ? (data.students.find(s => s.id === activeSession.studentId)?.color + '40') : '',
            }}
          >
            {activeSession && (
              <div
                className="absolute top-0 right-0 p-12 md:p-20 blur-3xl rounded-full opacity-20 pointer-events-none"
                style={{ backgroundColor: data.students.find(s => s.id === activeSession.studentId)?.color }}
              ></div>
            )}
            <div className="flex-1 w-full space-y-3">
              <label className="block text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left">Subject Selection</label>
              <div className="grid grid-cols-4 md:grid-cols-2 gap-2">
                {['Math', 'Physics', 'Chemistry', 'Biology'].map(sub => (
                  <button
                    key={sub}
                    disabled={!!activeSession}
                    onClick={() => setSelectedSubject(sub)}
                    className={`py-2 md:py-3.5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-tight transition-all border-2
                      ${selectedSubject === sub ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-blue-400'}
                      ${activeSession && selectedSubject !== sub ? 'opacity-30 cursor-not-allowed' : ''}
                    `}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:block w-px h-24 bg-slate-200 dark:bg-slate-700 shrink-0"></div>

            <div className="flex-1 w-full">
              {!activeSession ? (
                <div className="space-y-3 md:space-y-4">
                  <label className="block text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Active Tutoring Student</label>
                  <select
                    id="dashStudentSelect"
                    className="w-full px-4 md:px-5 py-3 md:py-4.5 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-xs md:text-sm font-bold focus:border-blue-500 outline-none transition-all shadow-sm dark:text-white"
                  >
                    <option value="">Student name</option>
                    {data.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.isGroup ? 'Group' : 'Single'})</option>)}
                  </select>
                  <button
                    onClick={() => {
                      const select = document.getElementById('dashStudentSelect') as HTMLSelectElement;
                      if (select.value) startTutoring(select.value);
                    }}
                    disabled={isStarting}
                    className="w-full bg-[#020617] dark:bg-blue-600 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 dark:hover:bg-blue-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStarting ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-satellite text-[8px] md:text-[10px] text-blue-400 dark:text-blue-200"></i>
                    )}
                    {isStarting ? 'Synchronizing...' : 'Open Connection'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 md:gap-6 text-center">
                  <div className="space-y-0.5 md:space-y-1">
                    <p className="text-xl md:text-2xl font-black text-[#020617] dark:text-white leading-tight">{data.students.find(s => s.id === activeSession.studentId)?.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Running:</span>
                      <span className="text-lg md:text-xl font-mono font-black text-[#020617] dark:text-white">
                        {formatTime(elapsedSeconds)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={endTutoring}
                    disabled={isClosing}
                    className="w-full bg-rose-500 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isClosing ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-power-off text-[8px] md:text-[10px]"></i>
                    )}
                    {isClosing ? 'Storing...' : 'Close & Store'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Analytics Graph */}
      <section className="animate-in slide-in-from-bottom duration-500">
        <TimeEarningsChart data={data} />
      </section>


    </div>
  );
};

export default Dashboard;
