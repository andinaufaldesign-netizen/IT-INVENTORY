import React from 'react';
import { User } from '../types';
import {
  Settings,
  Hotel,
  Shield,
  User as UserIcon,
  LogOut,
  Moon,
  Sun,
  HardDrive,
  Info,
  CheckCircle,
} from 'lucide-react';

interface SettingsViewProps {
  user: User | null;
  onLogout: () => void;
  inventoryCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onLogout,
  inventoryCount,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          System Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Application configuration, user profile, and system status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Profile */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Application Information</h3>
              <p className="text-xs text-slate-500">System deployment info</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">App Name</span>
              <span className="font-bold text-slate-900">HOTEL IT INVENTORY MANAGEMENT</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-semibold text-slate-800">Information Technology</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Version</span>
              <span className="font-mono text-slate-700">v2.4.0 (Enterprise Build)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Database Persistence</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Active Disk Storage
              </span>
            </div>
          </div>
        </div>

        {/* Current User Session */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Current Logged-in User</h3>
              <p className="text-xs text-slate-500">Active session credentials</p>
            </div>
          </div>

          {user ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Username</span>
                <span className="font-mono font-bold text-blue-700">{user.username}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Department Role</span>
                <span className="font-semibold text-slate-900">{user.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Session Status</span>
                <span className="font-semibold text-emerald-600">Authenticated (Secure)</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={onLogout}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Current Session</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">Not logged in.</div>
          )}
        </div>

        {/* UI Theme Preference */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Theme Preference</h3>
              <p className="text-xs text-slate-500">Visual style interface</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="font-medium text-slate-700">Hotel Executive Light (Active)</div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              Default
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Optimized for daytime hospitalities, barcode legibility, and high-contrast inventory inspection.
          </p>
        </div>

        {/* Database & Storage Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Storage Statistics</h3>
              <p className="text-xs text-slate-500">Hardware database metrics</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Total Recorded Assets</span>
              <span className="font-bold text-slate-900">{inventoryCount} items</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Audit Logs</span>
              <span className="font-semibold text-slate-800">Enabled (Every CRUD action)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Photo Optimization</span>
              <span className="font-semibold text-slate-800">Auto Canvas Resizing & Compression</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
