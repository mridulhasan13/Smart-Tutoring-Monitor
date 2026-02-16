
import React from 'react';
import { AppData } from '../types';

interface AuditLogsProps {
  data: AppData;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ data }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">System Audit Logs</h2>
        <p className="text-slate-500">Complete record of login activity and workspace events.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login History */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-history text-indigo-500"></i>
              Login History
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{data.loginHistory.length} Sessions</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-auto">
            {data.loginHistory.length > 0 ? data.loginHistory.map((record) => (
              <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${record.action === 'logout' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-600'}`}>
                    <i className={`fas ${record.action === 'logout' ? 'fa-sign-out-alt' : 'fa-sign-in-alt'}`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {record.action === 'logout' ? 'Session Terminated' : 'Authenticated Access'}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(record.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter border ${record.action === 'logout'
                    ? 'text-rose-600 bg-rose-50 border-rose-100'
                    : 'text-green-600 bg-green-50 border-green-100'
                    }`}>
                    {record.action === 'logout' ? 'Signed Out' : 'Verified'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-400 italic">No login records found.</div>
            )}
          </div>
        </div>

        {/* Workspace Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-door-open text-amber-500"></i>
              Tutor Entry/Exit Logs
            </h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-auto">
            {data.sessions.filter(s => s.status === 'completed').length > 0 ?
              data.sessions
                .filter(s => s.status === 'completed')
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .map((session) => {
                  const student = data.students.find(st => st.id === session.studentId);
                  return (
                    <div key={session.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">Tutoring: {session.studentName || student?.name || 'Unknown Reference'}</p>
                          {!student && (
                            <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded tracking-tighter uppercase">Archived</span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-slate-500">{new Date(session.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                          <p className="text-[10px] uppercase font-bold text-blue-400">Entry Time</p>
                          <p className="text-xs font-semibold text-blue-700">{new Date(session.startTime).toLocaleTimeString()}</p>
                        </div>
                        <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                          <p className="text-[10px] uppercase font-bold text-red-400">Exit Time</p>
                          <p className="text-xs font-semibold text-red-700">{session.endTime ? new Date(session.endTime).toLocaleTimeString() : 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Duration</p>
                          <p className="text-xs font-semibold text-slate-700">{session.duration} mins</p>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                <div className="p-10 text-center text-slate-400 italic">No entry/exit logs found yet.</div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
