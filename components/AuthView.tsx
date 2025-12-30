
import React, { useState } from 'react';
import { User } from '../types';

interface AuthViewProps {
  onLogin: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'RESET'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSSO = (provider: 'google' | 'microsoft') => {
    onLogin({
      id: `${provider}-123`,
      email: `user@${provider}.com`,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      isLoggedIn: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
      provider: provider
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      id: 'm123',
      email: email || 'demo@parked.ai',
      name: email.split('@')[0] || 'Fleet Driver',
      isLoggedIn: true,
      provider: 'email'
    });
  };

  return (
    <div className="min-h-screen p-8 flex flex-col justify-center items-center relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-sm space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl transform rotate-12 mb-6 animate-float">
            <span className="text-white text-4xl font-black italic">P</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">
            {mode === 'LOGIN' ? 'Terminal Login' : mode === 'SIGNUP' ? 'Enlist Fleet' : 'Secure Recovery'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
            Enterprise Vehicle Intel
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] p-10 shadow-3xl border border-white dark:border-slate-800 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleSSO('google')}
              className="py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm"
            >
              <i className="fa-brands fa-google text-blue-500"></i>
              <span className="font-black text-[9px] uppercase tracking-widest text-slate-700 dark:text-slate-200">Google</span>
            </button>
            <button 
              onClick={() => handleSSO('microsoft')}
              className="py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm"
            >
              <i className="fa-brands fa-microsoft text-blue-400"></i>
              <span className="font-black text-[9px] uppercase tracking-widest text-slate-700 dark:text-slate-200">Microsoft</span>
            </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[9px] font-black text-slate-300 uppercase">Or Encrypted Auth</span>
            <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input 
                type="email" 
                placeholder="Email ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none transition-all font-bold text-sm dark:text-white"
                required
              />
            </div>
            {mode !== 'RESET' && (
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input 
                  type="password" 
                  placeholder="Secret Key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none transition-all font-bold text-sm dark:text-white"
                  required
                />
              </div>
            )}
            <button className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/20 active:scale-95 transition-all italic">
              {mode === 'LOGIN' ? 'Initiate Link' : mode === 'SIGNUP' ? 'Create Profile' : 'Send Recovery Packet'}
            </button>
          </form>

          <div className="flex flex-col space-y-4 items-center">
            <button 
              onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
              className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              {mode === 'LOGIN' ? "Don't have an account? Enlist here" : 'Already have access? Terminal Login'}
            </button>
            {mode === 'LOGIN' && (
              <button 
                onClick={() => setMode('RESET')}
                className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
              >
                Access Recovery Protocol
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
