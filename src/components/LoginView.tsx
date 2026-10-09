import React, { useState } from 'react';
import { Hotel, Lock, User as UserIcon, LogIn, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { loginApi } from '../services/api';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onRequestEditCredentials: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onRequestEditCredentials,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await loginApi(username.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper quick filler for testing convenience
  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-600/10">
            <Hotel className="w-9 h-9" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              HOTEL IT INVENTORY
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
              IT Department Inventory Management System
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 sm:p-8 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. ITMANAGER"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>LOGIN</span>
                </>
              )}
            </button>
          </form>

          {/* Edit User & Password button */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={onRequestEditCredentials}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-400 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-slate-800/60"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>EDIT USER & PASSWORD</span>
            </button>
          </div>
        </div>

        {/* Quick Seed Accounts Guide for tester */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 space-y-2">
          <div className="font-semibold text-slate-300 flex items-center justify-between">
            <span>Authorized Initial Seed Accounts:</span>
            <span className="text-[10px] text-slate-500 font-mono">click to fill</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('ITMANAGER', 'syah')}
              className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-white font-mono">ITMANAGER</div>
              <div className="text-[10px] text-slate-400">pwd: syah</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ITASSIST', 'ihsan')}
              className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-white font-mono">ITASSIST</div>
              <div className="text-[10px] text-slate-400">pwd: ihsan</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ITTRAINEE', 'andi')}
              className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-white font-mono">ITTRAINEE</div>
              <div className="text-[10px] text-slate-400">pwd: andi</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
