
import React, { useState } from 'react';
import { AppData, Student } from '../types';
import { dbService } from '../services/dbService';

interface CommunicationsProps {
  data: AppData;
  onRefresh: () => void;
  initialStudentId?: string | null;
}

const Communications: React.FC<CommunicationsProps> = ({ data, onRefresh, initialStudentId }) => {
  const [showCompose, setShowCompose] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'sent' | 'templates'>('sent');
  const [newEmail, setNewEmail] = useState({
    toId: '',
    subject: '',
    body: ''
  });

  React.useEffect(() => {
    if (initialStudentId) {
      setNewEmail(prev => ({ ...prev, toId: initialStudentId }));
      setShowCompose(true);
    }
  }, [initialStudentId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = data.students.find(s => s.id === newEmail.toId);
    if (!student) return;

    setIsSending(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    await dbService.logEmail({
      to: `${student.name} (${student.email || 'no-email@tutor.com'})`,
      subject: newEmail.subject,
      body: newEmail.body
    });

    setIsSending(false);
    setShowCompose(false);
    setNewEmail({ toId: '', subject: '', body: '' });
    onRefresh();
  };

  const templates = [
    { title: 'Payment Reminder', subject: 'Tuition Payment Due', body: 'Assalamu Alaikum, this is a friendly reminder that the tuition payment for this month is now due. Please process it at your earliest convenience. Thank you!' },
    { title: 'Schedule Update', subject: 'Tutoring Session Reschedule', body: 'Greetings, I would like to propose a reschedule for our next tutoring session. Please let me know if [Time] works for you.' },
    { title: 'Student Progress', subject: 'Monthly Progress Report', body: 'Dear Parents, I am happy to share the progress report for [Student Name]. This month we covered [Topics] and observed great improvement in [Area].' }
  ];

  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#020617] uppercase tracking-tighter">Communications Center</h2>
          <p className="text-slate-500 font-medium">Manage professional correspondence with students and parents.</p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-3"
        >
          <i className="fas fa-plus"></i>
          Compose Dispatch
        </button>
      </div>

      <div className="flex gap-4 p-1.5 bg-slate-100 w-fit rounded-2xl mb-8">
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sent' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
        >
          Dispatch Logs
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
        >
          Quick Templates
        </button>
      </div>

      {activeTab === 'sent' ? (
        <div className="space-y-4">
          {data.emails && data.emails.length > 0 ? data.emails.map(email => (
            <div key={email.id} className="bg-white border border-slate-200 rounded-[2rem] p-8 pro-shadow hover:border-blue-100 transition-all flex flex-col md:flex-row gap-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600 shrink-0">
                <i className="fas fa-paper-plane"></i>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-black text-[#020617] uppercase tracking-tight">{email.subject}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">To: {email.to}</p>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(email.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-4">{email.body}</p>
              </div>
              <div className="shrink-0 flex items-start flex-col gap-2">
                <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-green-100 flex items-center gap-2">
                  <i className="fas fa-check-double text-[8px]"></i> Dispatched
                </span>
                <button
                  disabled={deletingId === email.id}
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this communication log?')) {
                      setDeletingId(email.id);
                      try {
                        await dbService.deleteEmail(email.id);
                        onRefresh();
                      } catch (err: any) {
                        console.error("Delete failed:", err);
                        alert("Failed to delete log. This might be due to database permissions.");
                      } finally {
                        setDeletingId(null);
                      }
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 w-full justify-center group text-[9px] font-black uppercase tracking-widest
                    ${deletingId === email.id
                      ? 'bg-slate-100 border-slate-200 text-slate-400'
                      : 'bg-red-50 hover:bg-red-100 text-rose-500 hover:text-rose-600 border-red-100 hover:border-red-200'}
                  `}
                >
                  {deletingId === email.id ? (
                    <i className="fas fa-circle-notch animate-spin text-[8px]"></i>
                  ) : (
                    <i className="fas fa-trash text-[8px] group-hover:scale-110 transition-transform"></i>
                  )}
                  {deletingId === email.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )) : (
            <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <i className="fas fa-mailbox text-slate-200 text-6xl mb-6"></i>
              <p className="text-slate-400 font-black uppercase tracking-[0.3em]">No dispatched communications recorded.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 pro-shadow hover:scale-[1.02] transition-all group cursor-pointer" onClick={() => {
              setNewEmail({ ...newEmail, subject: tpl.subject, body: tpl.body });
              setShowCompose(true);
            }}>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <i className="fas fa-copy"></i>
              </div>
              <h4 className="text-lg font-black text-[#020617] uppercase tracking-tight mb-2">{tpl.title}</h4>
              <p className="text-sm text-slate-500 line-clamp-3">{tpl.body}</p>
              <div className="mt-8 text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                Use Template <i className="fas fa-arrow-right"></i>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCompose && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-10 bg-[#020617] text-white flex justify-between items-center border-b border-white/5">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">New Dispatch</h3>
                <p className="text-blue-400/60 text-[10px] font-bold uppercase tracking-widest">Formal Tutoring Correspondence</p>
              </div>
              <button
                onClick={() => !isSending && setShowCompose(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-500 transition-all flex items-center justify-center text-xs"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSend} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Recipient Node</label>
                  <select
                    required
                    disabled={isSending}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold disabled:opacity-50"
                    value={newEmail.toId}
                    onChange={e => setNewEmail({ ...newEmail, toId: e.target.value })}
                  >
                    <option value="">Select Student...</option>
                    {data.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Dispatch Subject</label>
                  <input
                    required
                    disabled={isSending}
                    type="text"
                    placeholder="Subject line..."
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold disabled:opacity-50"
                    value={newEmail.subject}
                    onChange={e => setNewEmail({ ...newEmail, subject: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Message Content</label>
                <textarea
                  required
                  disabled={isSending}
                  rows={6}
                  placeholder="Draft your message here..."
                  className="w-full px-6 py-5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-medium leading-relaxed disabled:opacity-50 resize-none"
                  value={newEmail.body}
                  onChange={e => setNewEmail({ ...newEmail, body: e.target.value })}
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSending || !newEmail.toId}
                className={`w-full py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-2xl
                  ${isSending ? 'bg-slate-200 text-slate-400' : 'bg-[#020617] text-white hover:bg-blue-600'}
                `}
              >
                {isSending ? (
                  <>
                    <i className="fas fa-circle-notch animate-spin"></i>
                    Dispatching Stream...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane text-blue-400"></i>
                    Initialize Dispatch
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communications;
