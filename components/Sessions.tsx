
import React, { useState, useEffect } from 'react';
import { Session, AppData } from '../types';
import { dbService } from '../services/dbService';

interface SessionsProps {
  data: AppData;
  onRefresh: () => void;
}

// Helper component for live duration
const LiveDuration = ({ startTime }: { startTime: string }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const update = () => {
      const start = new Date(startTime).getTime();
      if (isNaN(start)) {
        setElapsed(0);
        return;
      }
      const now = new Date().getTime();
      setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0) return <span>{`${h}h ${m}m ${s.toString().padStart(2, '0')}s`}</span>;
  return <span>{`${m}m ${s.toString().padStart(2, '0')}s`}</span>;
};

const Sessions: React.FC<SessionsProps> = ({ data, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '16:00',
    duration: 60,
    status: 'scheduled' as const,
    subjectTaught: 'Math',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Construct ISO start time
    const startDateTime = new Date(`${newSession.date}T${newSession.startTime}:00`);
    const startTimeISO = startDateTime.toISOString();

    // Calculate end time
    const endDateTime = new Date(startDateTime.getTime() + newSession.duration * 60000);
    const endTimeISO = endDateTime.toISOString();

    if (editingId) {
      await dbService.updateSession(editingId, {
        ...newSession,
        startTime: startTimeISO,
        endTime: endTimeISO
      });
    } else {
      await dbService.addSession({
        ...newSession,
        startTime: startTimeISO,
        endTime: endTimeISO
      });
    }

    setShowModal(false);
    onRefresh();
  };

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'scheduled': return 'bg-cyan-100 text-cyan-700';
      case 'cancelled': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const sortedSessions = [...data.sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20" onClick={() => setActiveMenuId(null)}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#020617] uppercase tracking-tighter">Timeline Analysis</h2>
          <p className="text-slate-500 font-medium">Historical record of all tutoring interactions.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#020617] hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl flex items-center gap-3"
        >
          <i className="fas fa-calendar-check"></i>
          Log History
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden pro-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Time</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Exit Time</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Link</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject & Notes</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSessions.length > 0 ? sortedSessions.map(session => {
                const student = data.students.find(s => s.id === session.studentId);
                const sessionDate = new Date(session.date);
                const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                // const timeRange = session.startTime ? `${formatTime(session.startTime)}${session.endTime ? ' - ' + formatTime(session.endTime) : ''}` : 'Time N/A';

                return (
                  <tr key={session.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-black text-[#020617]">
                        {sessionDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1 bg-green-50 px-2 py-0.5 rounded-full w-fit border border-green-100">
                        IN: {session.startTime ? formatTime(session.startTime) : '--:--'}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-black text-[#020617] opacity-0">.</div>
                      <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1 bg-rose-50 px-2 py-0.5 rounded-full w-fit border border-rose-100">
                        OUT: {session.endTime ? formatTime(session.endTime) : 'Active'}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black"
                          style={{ backgroundColor: student?.color || '#cbd5e1' }}
                        >
                          {student?.name.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {session.studentName || student?.name || 'Deleted Reference'}
                          {!student && session.studentName && (
                            <span className="ml-2 text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded tracking-tighter uppercase">Archived</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">{session.subjectTaught || 'General'}</div>
                      {session.notes && <p className="text-xs text-slate-500 truncate max-w-[200px]">{session.notes}</p>}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-medium text-slate-500">
                      {(() => {
                        if (session.status === 'in-progress' && session.startTime) {
                          return <LiveDuration startTime={session.startTime} />;
                        }
                        if (session.startTime && session.endTime) {
                          const start = new Date(session.startTime).getTime();
                          const end = new Date(session.endTime).getTime();
                          const diff = Math.floor((end - start) / 1000);
                          const h = Math.floor(diff / 3600);
                          const m = Math.floor((diff % 3600) / 60);
                          const s = diff % 60;
                          if (h > 0) return `${h}h ${m}m ${s.toString().padStart(2, '0')}s`;
                          return `${m}m ${s.toString().padStart(2, '0')}s`;
                        }
                        const m_orig = session.duration || 0;
                        const h_orig = Math.floor(m_orig / 60);
                        const mins_orig = m_orig % 60;
                        if (h_orig > 0) return `${h_orig}h ${mins_orig}m 00s`;
                        return `${m_orig}m 00s`;
                      })()}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === session.id ? null : session.id);
                          }}
                          className="text-slate-300 hover:text-blue-600 p-2 transition-colors"
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                        {activeMenuId === session.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in duration-200">
                            <button
                              onClick={() => {
                                setNewSession({
                                  ...session,
                                  studentId: session.studentId,
                                  date: session.date,
                                  startTime: session.startTime ? new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '16:00',
                                  duration: session.duration || 60,
                                  status: session.status,
                                  subjectTaught: session.subjectTaught || 'Math',
                                  notes: session.notes || ''
                                });
                                setEditingId(session.id);
                                setShowModal(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-colors"
                            >
                              <i className="fas fa-edit"></i>
                              Edit Session
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this session log?')) {
                                  await dbService.deleteSession(session.id);
                                  onRefresh();
                                }
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-4 py-3 rounded-xl hover:bg-rose-50 text-rose-600 font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-colors"
                            >
                              <i className="fas fa-trash"></i>
                              Delete Log
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">No historical nodes detected.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-10 bg-[#020617] text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Fixed Log Entry</h3>
                <p className="text-blue-400/60 text-[10px] font-bold uppercase tracking-widest">Latch Entry/Exit Times</p>
              </div>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-500 transition-all flex items-center justify-center text-xs">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Select Student</label>
                <select
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                  value={newSession.studentId}
                  onChange={e => setNewSession({ ...newSession, studentId: e.target.value })}
                >
                  <option value="">Select node...</option>
                  {data.students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.subject})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Notes</label>
                <textarea
                  rows={2}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold resize-none"
                  value={newSession.notes}
                  onChange={e => setNewSession({ ...newSession, notes: e.target.value })}
                  placeholder="Optional session notes..."
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                    value={newSession.date}
                    onChange={e => setNewSession({ ...newSession, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Entry Time</label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="time"
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                      value={newSession.startTime}
                      onChange={e => setNewSession({ ...newSession, startTime: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                        setNewSession({ ...newSession, startTime: timeString });
                      }}
                      className="px-4 bg-blue-100 text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-200 transition-colors"
                    >
                      Now
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Subject</label>
                <select
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                  value={newSession.subjectTaught}
                  onChange={e => setNewSession({ ...newSession, subjectTaught: e.target.value })}
                >
                  <option value="Math">Math</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="English">English</option>
                  <option value="ICT">ICT</option>
                  <option value="Bangla">Bangla</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Duration (min)</label>
                  <input
                    required
                    type="number"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                    value={newSession.duration}
                    onChange={e => setNewSession({ ...newSession, duration: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Status</label>
                  <select
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                    value={newSession.status}
                    onChange={e => setNewSession({ ...newSession, status: e.target.value as any })}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={!newSession.studentId}
                className="w-full bg-[#020617] text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl mt-4"
              >
                {editingId ? 'Update Session Log' : 'Establish History'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;
