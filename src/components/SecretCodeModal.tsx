import React, { useState } from 'react';
import { KeyRound, X, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { verifySecretCodeApi } from '../services/api';

interface SecretCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (secretToken: string) => void;
}

export const SecretCodeModal: React.FC<SecretCodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretCode.trim()) {
      setError('Please enter the secret code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await verifySecretCodeApi(secretCode.trim());
      setSecretCode('');
      onSuccess(res.secretToken);
    } catch (err: any) {
      // Must be: "Invalid secret code. Please try again."
      setError(err?.message || 'Invalid secret code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-900">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">ENTER SECRET CODE</h3>
              <p className="text-xs text-slate-500">Security verification required for credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Secret Code
            </label>
            <input
              type="password"
              value={secretCode}
              onChange={(e) => {
                setSecretCode(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter authorization secret..."
              autoFocus
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !secretCode.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>VERIFY</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
