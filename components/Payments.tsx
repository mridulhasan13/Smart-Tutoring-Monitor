
import React, { useState } from 'react';
import { Payment, AppData } from '../types';
import { dbService } from '../services/dbService';

interface PaymentsProps {
  data: AppData;
  onRefresh: () => void;
}

const Payments: React.FC<PaymentsProps> = ({ data, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    studentId: '',
    amount: 5000,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending' as const,
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await dbService.updatePayment(editingId, newPayment);
    } else {
      await dbService.addPayment(newPayment as any);
    }
    setShowModal(false);
    setEditingId(null);
    onRefresh();
  };

  const handleStatusUpdate = async (id: string, current: Payment['status']) => {
    const next: Payment['status'] = current === 'paid' ? 'pending' : 'paid';
    await dbService.updatePaymentStatus(id, next);
    onRefresh();
  };

  const sortedPayments = [...data.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#020617] uppercase tracking-tighter">Financial Ledger</h2>
          <p className="text-slate-500 font-medium">Tracking monthly tuition commitments and revenue streams.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#020617] hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl flex items-center gap-3"
        >
          <i className="fas fa-file-invoice-dollar"></i>
          Issue Invoice
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden pro-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref Token</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Month</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commitment (৳)</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Maturity Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                // Pre-calculate session buckets for each student
                const studentProgress = new Map<string, number>(); // studentId -> remainingSessions

                // Initialize with total completed sessions per student
                data.students.forEach(s => {
                  const total = data.sessions.filter(sess =>
                    sess.studentId === s.id && sess.status === 'completed'
                  ).length;
                  studentProgress.set(s.id, total);
                });

                // Sort payments oldest to newest to fill buckets correctly
                const chronPayments = [...data.payments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const paymentProgress = new Map<string, number>(); // paymentId -> assignedNodes

                chronPayments.forEach(p => {
                  const s = data.students.find(stu => stu.id === p.studentId);
                  if (s) {
                    const remaining = studentProgress.get(s.id) || 0;
                    const target = s.targetSessions || 12;
                    const assigned = Math.min(remaining, target);
                    paymentProgress.set(p.id, assigned);
                    studentProgress.set(s.id, remaining - assigned);
                  }
                });

                return sortedPayments.length > 0 ? sortedPayments.map(payment => {
                  const student = data.students.find(s => s.id === payment.studentId);
                  const target = student?.targetSessions || 12;
                  const completedNodes = paymentProgress.get(payment.id) || 0;
                  const progress = (completedNodes / target) * 100;

                  return (
                    <tr key={payment.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-black text-slate-700 uppercase tracking-tight">{payment.studentName || student?.name || 'Unknown Reference'}</div>
                          {!student && (
                            <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded tracking-tighter uppercase">Archived</span>
                          )}
                        </div>
                        {student?.institution && <div className="text-[9px] font-bold text-slate-400 mt-1">{student.institution}</div>}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">
                            <span>{completedNodes} / {target} Nodes</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-500">{payment.month || '-'}</span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-sm font-black text-[#020617]">৳{payment.amount}</span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium text-slate-500">
                        {new Date(payment.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <button
                          onClick={() => handleStatusUpdate(payment.id, payment.status)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all
                            ${payment.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                              payment.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'}
                          `}
                        >
                          {payment.status}
                        </button>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-right">
                        <div className="relative group">
                          <button className="text-slate-400 hover:text-blue-600 transition-colors p-2">
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          <div className="absolute right-0 top-0 mt-8 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 hidden group-hover:block z-10 animate-in fade-in zoom-in duration-200">
                            <button
                              onClick={() => {
                                if (student) {
                                  const msg = encodeURIComponent(`Assalamu Alaikum ${student.name}, kindly process the tuition payment of ৳${payment.amount} due on ${payment.dueDate}. Thank you!`);
                                  window.open(`https://wa.me/${student.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                                }
                              }}
                              className="w-full text-left px-4 py-3 rounded-xl hover:bg-green-50 text-green-600 font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-colors"
                            >
                              <i className="fab fa-whatsapp text-lg"></i>
                              Send Reminder
                            </button>
                            <button
                              onClick={() => {
                                setNewPayment({
                                  ...payment,
                                  studentId: payment.studentId,
                                  amount: payment.amount,
                                  date: new Date(payment.date).toISOString().split('T')[0],
                                  dueDate: new Date(payment.dueDate).toISOString().split('T')[0],
                                  status: payment.status,
                                  month: payment.month,
                                  notes: payment.notes
                                });
                                setEditingId(payment.id);
                                setShowModal(true);
                              }}
                              className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-colors"
                            >
                              <i className="fas fa-edit"></i>
                              Edit Details
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this payment record?')) {
                                  await dbService.deletePayment(payment.id);
                                  onRefresh();
                                }
                              }}
                              className="w-full text-left px-4 py-3 rounded-xl hover:bg-rose-50 text-rose-600 font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-colors"
                            >
                              <i className="fas fa-trash"></i>
                              Delete Record
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">Financial stream is idle.</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div >

      {showModal && (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-10 bg-[#020617] text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">New Invoice</h3>
                <p className="text-blue-400/60 text-[10px] font-bold uppercase tracking-widest">Revenue Initialization</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-500 transition-all flex items-center justify-center text-xs">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Target Node</label>
                <select
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                  value={newPayment.studentId}
                  onChange={e => {
                    const sid = e.target.value;
                    const st = data.students.find(s => s.id === sid);

                    // Auto-calculate Maturity Date (Due Date)
                    let calculatedDueDate = '';
                    if (st) {
                      const target = st.targetSessions || 12;
                      // Get all valid sessions sorted
                      const sessions = data.sessions
                        .filter(s => s.studentId === st.id && (s.status === 'completed' || s.status === 'in-progress' || s.status === 'scheduled'))
                        .sort((a, b) => new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime());

                      // Find the *next* maturity event
                      // (i.e., the first multiple of `target` that corresponds to a session)
                      // Heuristic: Find the highest multiple of target reached so far? 
                      // Or the one relevant to the current month? 
                      // Let's assume we are billing for the current or upcoming cycle.
                      // Find the first session index N (1-based) where N % target === 0.
                      // Ideally we pick the one that matches the billing month or is the "next" one.
                      // Simple logic: Find the LAST completed/scheduled session that was a maturity event.

                      const maturityDates = sessions
                        .map((s, i) => (i + 1) % target === 0 ? s.date : null)
                        .filter(d => d !== null);

                      if (maturityDates.length > 0) {
                        // Pick the latest one found (most recent cycle completion)
                        calculatedDueDate = maturityDates[maturityDates.length - 1] as string;
                      }
                    }

                    setNewPayment({
                      ...newPayment,
                      studentId: sid,
                      amount: st?.monthlyPayment || 5000,
                      dueDate: calculatedDueDate || newPayment.dueDate
                    });
                  }}
                >
                  <option value="">Select student...</option>
                  {data.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Billing Month</label>
                <select
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                  value={newPayment.month}
                  onChange={e => setNewPayment({ ...newPayment, month: e.target.value })}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - 2 + i); // Range from 2 months ago to future
                    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                  }).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Amount (৳)</label>
                  <input
                    required
                    type="number"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                    value={newPayment.amount}
                    onChange={e => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Status</label>
                  <select
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                    value={newPayment.status}
                    onChange={e => setNewPayment({ ...newPayment, status: e.target.value as any })}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Due Date</label>
                <input
                  required
                  type="date"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                  value={newPayment.dueDate}
                  onChange={e => setNewPayment({ ...newPayment, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Notes / Comments</label>
                <textarea
                  rows={2}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold resize-none"
                  value={newPayment.notes || ''}
                  onChange={e => setNewPayment({ ...newPayment, notes: e.target.value })}
                  placeholder="Optional remarks..."
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={!newPayment.studentId}
                className="w-full bg-[#020617] text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl mt-4"
              >
                Issue Commitment
              </button>
            </form>
          </div>
        </div>
      )}
    </div >
  );
};

export default Payments;
