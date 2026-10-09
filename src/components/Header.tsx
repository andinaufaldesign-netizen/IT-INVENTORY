import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Clock, Calendar, LogOut, Menu, Shield, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onToggleMobileMenu }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // Update every second using device time
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left Title and Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  HOTEL IT INVENTORY
                </h1>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                IT Department Inventory Management System
              </p>
            </div>
          </div>

          {/* Right Section: User Pill, Real-time Date & Clock, Logout */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Realtime Date & Clock */}
            <div className="hidden md:flex flex-col items-end text-right border-r border-slate-200 pr-5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 font-mono tracking-wide">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* User Profile Pill */}
            {user && (
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.username}
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                    {user.role}
                  </div>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
