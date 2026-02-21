
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface ForgotPasswordProps {
    onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address');
            return;
        }
        setLoading(true);
        setError('');
        setMsg('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/`,
            });
            if (error) throw error;
            setMsg('Password reset link sent! Check your email.');
        } catch (err: any) {
            if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                setError('Network Connection Error. Please verify your internet and try again.');
            } else {
                setError(err.message || 'Failed to send reset link');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#020617] flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in fade-in zoom-in duration-500">
                <div className="bg-[#0f172a] p-8 text-center text-white relative">
                    <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"></div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase relative z-10">Recover Account</h1>
                    <p className="text-blue-400/40 mt-1 font-bold text-[8px] uppercase tracking-[0.4em] relative z-10">Security Recovery</p>
                </div>

                <div className="p-8 bg-white space-y-6">
                    {msg && (
                        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-center font-bold text-sm">
                            <i className="fas fa-check-circle mr-2"></i>{msg}
                        </div>
                    )}

                    <form onSubmit={handleForgotPassword} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Email Address</label>
                            <input
                                type="email"
                                placeholder="type.your.mail@gmail.com"
                                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all text-base font-semibold text-slate-800"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-[#0f172a] text-white py-5 rounded-[3rem] font-black text-xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 uppercase">
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Send Reset Link'}
                        </button>
                        <button type="button" onClick={onBack} className="w-full py-3 text-[10px] font-black text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-colors">
                            Back to Login
                        </button>
                    </form>

                    {error && (
                        <div className="p-5 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-center gap-4 animate-in shake">
                            <i className="fas fa-triangle-exclamation text-rose-500"></i>
                            <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center text-slate-400 text-[9px] font-black uppercase tracking-[0.6em]">
                    DEVELOPED BY MRIDUL
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
