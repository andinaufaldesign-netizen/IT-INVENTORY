import React, { useState, useEffect } from 'react';
import { UserManagementItem } from '../types';
import { fetchUsersApi, updateUsersApi } from '../services/api';
import {
  Users,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Save,
  Edit2,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';

interface EditUsersViewProps {
  secretToken: string;
  onBackToLogin: () => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const EditUsersView: React.FC<EditUsersViewProps> = ({
  secretToken,
  onBackToLogin,
  onShowToast,
}) => {
  const [users, setUsers] = useState<UserManagementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable local state: mapping userId -> { username, password, isEditing, showPassword }
  const [editState, setEditState] = useState<
    Record<
      string,
      {
        username: string;
        password: string;
        isEditing: boolean;
        showPassword: boolean;
      }
    >
  >({});

  useEffect(() => {
    loadUsers();
  }, [secretToken]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUsersApi(secretToken);
      setUsers(data);
      const initialEdits: Record<string, any> = {};
      data.forEach((u) => {
        initialEdits[u.id] = {
          username: u.username,
          password: '', // Blank initially means unchanged
          isEditing: false,
          showPassword: false,
        };
      });
      setEditState(initialEdits);
    } catch (err: any) {
      setError(err?.message || 'Failed to load user accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEdit = (userId: string) => {
    setEditState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        isEditing: !prev[userId]?.isEditing,
      },
    }));
  };

  const handleToggleShowPassword = (userId: string) => {
    setEditState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        showPassword: !prev[userId]?.showPassword,
      },
    }));
  };

  const handleFieldChange = (userId: string, field: 'username' | 'password', value: string) => {
    setEditState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleSaveChanges = async () => {
    // Validate
    const updates: Array<{ id: string; username: string; password?: string }> = [];

    for (const u of users) {
      const state = editState[u.id];
      if (!state) continue;

      if (!state.username.trim()) {
        setError(`Username for ${u.label} cannot be empty.`);
        return;
      }

      // Check if username or password was modified
      const usernameChanged = state.username.trim() !== u.username;
      const passwordChanged = state.password.trim().length > 0;

      if (usernameChanged || passwordChanged) {
        updates.push({
          id: u.id,
          username: state.username.trim(),
          ...(passwordChanged ? { password: state.password.trim() } : {}),
        });
      }
    }

    if (updates.length === 0) {
      onShowToast('No changes detected to save.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateUsersApi(secretToken, updates);
      onShowToast('User credentials updated successfully.', 'success');
      // Reload users to reflect fresh data
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to update credentials. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToLogin}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO LOGIN</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Verified Admin Session</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="border-b border-slate-800 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  EDIT USER & PASSWORD
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Update usernames and authentication passwords for IT Department staff
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-300 rounded-xl text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm">Loading security accounts...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">User</th>
                      <th className="py-3 px-4 font-semibold">Username</th>
                      <th className="py-3 px-4 font-semibold">Password</th>
                      <th className="py-3 px-4 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => {
                      const state = editState[u.id] || {
                        username: u.username,
                        password: '',
                        isEditing: false,
                        showPassword: false,
                      };

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                          {/* User label */}
                          <td className="py-4 px-4">
                            <div className="font-semibold text-white">{u.label}</div>
                            <div className="text-xs text-blue-400 font-mono">{u.role}</div>
                          </td>

                          {/* Username input or text */}
                          <td className="py-4 px-4">
                            {state.isEditing ? (
                              <input
                                type="text"
                                value={state.username}
                                onChange={(e) => handleFieldChange(u.id, 'username', e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-hidden focus:border-blue-500"
                                placeholder="Username..."
                              />
                            ) : (
                              <div className="text-slate-200 font-mono font-semibold">
                                {state.username}
                              </div>
                            )}
                          </td>

                          {/* Password input or masked */}
                          <td className="py-4 px-4">
                            {state.isEditing ? (
                              <div className="relative">
                                <input
                                  type={state.showPassword ? 'text' : 'password'}
                                  value={state.password}
                                  onChange={(e) => handleFieldChange(u.id, 'password', e.target.value)}
                                  className="w-full pr-9 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-hidden focus:border-blue-500"
                                  placeholder="Leave blank to keep current"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleToggleShowPassword(u.id)}
                                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                                >
                                  {state.showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <div className="text-slate-500 font-mono tracking-widest text-base">
                                ••••••••
                              </div>
                            )}
                          </td>

                          {/* Action toggle */}
                          <td className="py-4 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleEdit(u.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                state.isEditing
                                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 hover:bg-blue-600/50'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>{state.isEditing ? 'Done Editing' : 'Edit'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden space-y-4">
                {users.map((u) => {
                  const state = editState[u.id] || {
                    username: u.username,
                    password: '',
                    isEditing: false,
                    showPassword: false,
                  };

                  return (
                    <div
                      key={u.id}
                      className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{u.label}</div>
                          <div className="text-[11px] text-blue-400">{u.role}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleEdit(u.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                          {state.isEditing ? 'Done' : 'Edit'}
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[11px] text-slate-400 font-medium">Username</label>
                          {state.isEditing ? (
                            <input
                              type="text"
                              value={state.username}
                              onChange={(e) => handleFieldChange(u.id, 'username', e.target.value)}
                              className="mt-1 w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
                            />
                          ) : (
                            <div className="text-white font-mono font-medium">{state.username}</div>
                          )}
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 font-medium">Password</label>
                          {state.isEditing ? (
                            <div className="relative mt-1">
                              <input
                                type={state.showPassword ? 'text' : 'password'}
                                value={state.password}
                                onChange={(e) => handleFieldChange(u.id, 'password', e.target.value)}
                                className="w-full pr-9 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
                                placeholder="New password..."
                              />
                              <button
                                type="button"
                                onClick={() => handleToggleShowPassword(u.id)}
                                className="absolute right-2.5 top-2.5 text-slate-400"
                              >
                                {state.showPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="text-slate-500 font-mono tracking-widest">• • • • • • • •</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer text-center"
                >
                  BACK TO LOGIN
                </button>

                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>SAVE CHANGES</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
