
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { TutorProfile } from '../types';

interface LoginProps {
  onLogin: () => void;
  onForgotPassword: () => void;
}

type RegisterStep = 'identity' | 'academic' | 'security';

const TypableInput = ({ label, value, onChange, placeholder, type = "text", icon, required = false, autoFocus = false }: any) => (
  <div className="space-y-1.5 w-full">
    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
      {label} {required && <span className="text-blue-500 font-bold">*</span>}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
        <i className={`fas ${icon}`}></i>
      </div>
      <input
        type={type}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all text-base font-semibold text-slate-800 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLogin, onForgotPassword }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [regStep, setRegStep] = useState<RegisterStep>('identity');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [returningAvatar, setReturningAvatar] = useState<string | null>(null);
  const [returningName, setReturningName] = useState<string | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);

  // Register State
  const [profile, setProfile] = useState<TutorProfile>({
    name: '',
    email: '',
    profession: '',
    university: '',
    yearTerm: ''
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('last_login_email');
    const savedAvatar = localStorage.getItem('last_login_avatar');
    const savedName = localStorage.getItem('last_login_name');

    // Always fetch a branding image in the background regardless of saved state
    const fetchBranding = async (email?: string) => {
      if (email) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .ilike('email', email)
          .maybeSingle();

        if (prof) {
          if (prof.avatar_url) setReturningAvatar(prof.avatar_url);
          if (prof.full_name) setReturningName(prof.full_name);
        }
      }
    };

    if (savedEmail && savedEmail.trim() !== '') {
      setLoginEmail(savedEmail);
      setIsReturningUser(true);
      if (savedAvatar) setReturningAvatar(savedAvatar);
      if (savedName) setReturningName(savedName);
      fetchBranding(savedEmail);
    }
  }, [mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      // Persist data on success
      localStorage.setItem('last_login_email', loginEmail);

      // Fetch profile to save name/avatar for next time
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('email', loginEmail)
        .maybeSingle();

      if (prof) {
        if (prof.avatar_url) localStorage.setItem('last_login_avatar', prof.avatar_url);
        if (prof.full_name) localStorage.setItem('last_login_name', prof.full_name);
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Network Connection Error. Please verify your internet and try again.');
      } else {
        setError(err.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectAccount = (prof: any) => {
    if (!prof.email) {
      setError(`Account '${prof.full_name}' has no associated email.`);
      return;
    }
    setLoginEmail(prof.email);
    setReturningName(prof.full_name);
    setReturningAvatar(prof.avatar_url);
    setIsReturningUser(true);
    setLoginPassword(''); // Clear password for new selection
  };

  const clearReturningUser = () => {
    localStorage.removeItem('last_login_email');
    localStorage.removeItem('last_login_avatar');
    localStorage.removeItem('last_login_name');
    setLoginEmail('');
    setLoginPassword('');
    setIsReturningUser(false);
    setReturningAvatar(null);
    setReturningName(null);
  };

  const handleRegisterNext = () => {
    setError('');
    if (regStep === 'identity') {
      if (!profile.name || !profile.email) {
        setError('Name and Email are required');
        return;
      }
      setRegStep('academic');
    } else if (regStep === 'academic') {
      setRegStep('security');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setMsg('');

    try {
      // 1. Check if email already exists in profiles
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('email')
        .ilike('email', profile.email)
        .maybeSingle();

      if (profileCheckError) {
        console.error('Email check failed:', profileCheckError);
      }

      if (existingProfile) {
        setError('This email is already registered. Please login instead.');
        setLoading(false);
        return;
      }

      // 2. Proceed with registration
      const { data, error: authError } = await supabase.auth.signUp({
        email: profile.email,
        password: password,
        options: {
          data: {
            full_name: profile.name,
          },
          emailRedirectTo: `${window.location.origin}/#/dashboard`,
        },
      });

      if (authError) throw authError;

      if (data.user) {
        // Insert/Upsert profile
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email: profile.email,
          full_name: profile.name,
          profession: profile.profession || 'Educator',
          university: profile.university,
          year_term: profile.yearTerm
        });

        if (profileError) {
          console.error('Profile creation failed:', profileError);
        }

        // Persist name/email immediately for the returning user view
        localStorage.setItem('last_login_email', profile.email);
        localStorage.setItem('last_login_name', profile.name);
        setReturningName(profile.name);
        setLoginEmail(profile.email);

        setMsg('Sign up successful! Re-authorizing...');
        setTimeout(() => {
          setMode('login');
          setIsReturningUser(true);
        }, 1500);
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Network Connection Error. Please verify your internet and try again.');
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#020617] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-500 border border-white/20">

        <div className="bg-[#0f172a] p-5 sm:p-6 text-center text-white relative shrink-0">
          <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"></div>
          <div className="mb-2 relative z-10 flex justify-center animate-stagger-1">
            <img src="/logo.png" alt="Tuition Logo" className="w-14 h-14 sm:w-16 sm:h-16 object-contain active:scale-95 transition-transform" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tighter uppercase leading-none relative z-10 animate-stagger-2">Smart Tutoring Monitor</h1>
          <p className="text-blue-400/40 mt-1 font-bold text-[8px] uppercase tracking-[0.4em] relative z-10 animate-stagger-2">
            {mode === 'register' ? `Stage: ${regStep}` : 'Platform Authorization'}
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-white flex flex-col sm:justify-center sm:min-h-[380px] overflow-y-auto custom-scrollbar">
          <style>{`
            @keyframes stagger-fade-in {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-stagger-1 { animation: stagger-fade-in 0.4s ease-out forwards; animation-delay: 0.1s; opacity: 0; }
            .animate-stagger-2 { animation: stagger-fade-in 0.4s ease-out forwards; animation-delay: 0.2s; opacity: 0; }
            .animate-stagger-3 { animation: stagger-fade-in 0.4s ease-out forwards; animation-delay: 0.3s; opacity: 0; }
            .animate-stagger-4 { animation: stagger-fade-in 0.4s ease-out forwards; animation-delay: 0.4s; opacity: 0; }
          `}</style>
          {msg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-center font-bold text-sm">
              <i className="fas fa-check-circle mr-2"></i>{msg}
            </div>
          )}

          {mode === 'register' ? (
            <div className="space-y-8 animate-in fade-in">
              {regStep === 'identity' && (
                <form onSubmit={(e) => { e.preventDefault(); handleRegisterNext(); }} className="space-y-4">
                  <div className="text-center mb-6"><h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tight">Identity Stage</h3></div>
                  <TypableInput icon="fa-user-tie" label="Full Name" placeholder="Enter Your full Name" value={profile.name} onChange={(v: string) => setProfile({ ...profile, name: v })} required autoFocus />
                  <TypableInput icon="fa-envelope-open" label="Active Email" type="email" placeholder="type.your.mail@gmail.com" value={profile.email} onChange={(v: string) => setProfile({ ...profile, email: v })} required />
                  <div className="pt-8">
                    <button type="submit" className="w-full bg-[#0f172a] text-white py-3 sm:py-5 rounded-2xl sm:rounded-[3rem] font-black text-lg sm:text-xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 uppercase">Continue <i className="fas fa-chevron-right text-blue-400"></i></button>
                    <button type="button" onClick={() => setMode('login')} className="w-full mt-4 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-[10px] font-black text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all uppercase tracking-widest">
                      Already have an account? Login
                    </button>
                  </div>
                </form>
              )}

              {regStep === 'academic' && (
                <form onSubmit={(e) => { e.preventDefault(); setRegStep('security'); }} className="space-y-4">
                  <div className="text-center mb-6"><h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tight">Academic Profile</h3></div>
                  <TypableInput icon="fa-landmark" label="University" placeholder="University Name" value={profile.university} onChange={(v: string) => setProfile({ ...profile, university: v })} autoFocus />
                  <TypableInput icon="fa-calendar" label="Year/Term" placeholder="starting year" value={profile.yearTerm} onChange={(v: string) => setProfile({ ...profile, yearTerm: v })} />
                  <div className="flex gap-4 mt-6">
                    <button type="button" onClick={() => setRegStep('identity')} className="flex-1 bg-slate-100 text-slate-500 py-3 sm:py-5 rounded-2xl sm:rounded-[3rem] font-bold text-base sm:text-lg hover:bg-slate-200 transition-all uppercase">Back</button>
                    <button type="submit" className="flex-[2] bg-[#0f172a] text-white py-3 sm:py-5 rounded-2xl sm:rounded-[3rem] font-black text-lg sm:text-xl shadow-xl hover:bg-blue-600 transition-all uppercase">Next</button>
                  </div>
                </form>
              )}

              {regStep === 'security' && (
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="text-center mb-6"><h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tight">Security Protocol</h3></div>
                  <TypableInput icon="fa-lock" label="Password" type="password" placeholder="******" value={password} onChange={(v: string) => setPassword(v)} required autoFocus />
                  <TypableInput icon="fa-lock" label="Confirm Password" type="password" placeholder="******" value={confirmPassword} onChange={(v: string) => setConfirmPassword(v)} required />

                  <div className="flex gap-4 mt-6">
                    <button type="button" onClick={() => setRegStep('academic')} className="flex-1 bg-slate-100 text-slate-500 py-3 sm:py-5 rounded-2xl sm:rounded-[3rem] font-bold text-base sm:text-lg hover:bg-slate-200 transition-all uppercase">Back</button>
                    <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 text-white py-3 sm:py-5 rounded-2xl sm:rounded-[3rem] font-black text-lg sm:text-xl shadow-2xl hover:bg-blue-500 transition-all uppercase flex justify-center">
                      {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Register'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              {isReturningUser ? (
                <div className="text-center space-y-3 animate-stagger-1">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto shadow-md overflow-hidden border-2 border-white dark:border-slate-700 relative z-20">
                      {returningAvatar ? (
                        <img src={returningAvatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-2xl font-black">
                          {returningName?.charAt(0) || loginEmail?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">{loginEmail}</p>
                    <h3 className="text-xl font-black text-[#0f172a] tracking-tight leading-tight">
                      {returningName || (loginEmail ? loginEmail.split('@')[0] : 'Verified Account')}
                    </h3>
                  </div>
                </div>
              ) : (
                <TypableInput icon="fa-envelope" label="Manual Entry Email" type="email" placeholder="type.your.mail@gmail.com" value={loginEmail} onChange={(v: string) => setLoginEmail(v)} required autoFocus />
              )}

              <div className="animate-stagger-2">
                {isReturningUser ? (
                  <TypableInput icon="fa-key" label="System Password" type="password" placeholder="******" value={loginPassword} onChange={(v: string) => setLoginPassword(v)} required autoFocus />
                ) : (
                  <TypableInput icon="fa-key" label="Password" type="password" placeholder="******" value={loginPassword} onChange={(v: string) => setLoginPassword(v)} required />
                )}
              </div>

              <div className="flex justify-between items-center px-1 animate-stagger-3">
                <button type="button" onClick={onForgotPassword} className="text-[10px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors">
                  Forgot Password?
                </button>
              </div>

              <div className="flex justify-center mt-0 animate-stagger-3">
                <button type="submit" disabled={loading} className="px-10 py-3 bg-[#0f172a] text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-base shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 uppercase active:scale-95">
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <>Login <i className="fas fa-arrow-right-long text-blue-400"></i></>}
                </button>
              </div>

              <div className="text-center space-y-4 animate-stagger-4">
                {isReturningUser ? (
                  <button type="button" onClick={clearReturningUser} className="text-[10px] font-black text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-colors">
                    Not you? Log in as different user
                  </button>
                ) : (
                  <button type="button" onClick={() => setMode('register')} className="text-[10px] font-black text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-colors">
                    New User? Register
                  </button>
                )}
              </div>
            </form>
          )}

          {error && <div className="mt-10 p-5 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-center gap-4 animate-in shake"><i className="fas fa-triangle-exclamation text-rose-500"></i><p className="text-rose-600 text-[10px] font-black uppercase tracking-widest">{error}</p></div>}
        </div>

        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 text-center text-slate-400 text-[9px] font-black uppercase tracking-[0.6em] relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20"></div>
          DEVELOPED BY MRIDUL
        </div>
      </div>
    </div>
  );
};

export default Login;
