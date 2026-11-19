import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@nextrial.org');
  const [password, setPassword] = useState('Admin@NexTrial2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-page text-text-main">
      {/* 1. Thin Saffron Strip */}
      <div className="h-1 bg-saffron w-full" role="presentation" />

      {/* 2. Persistent Notice Bar */}
      <div className="bg-amber-100 border-b border-amber-300 px-4 py-1.5 text-xs text-amber-900 font-medium text-center">
        Prototype - synthetic data. Academic project, not an official Government of India website.
      </div>

      {/* Header Banner */}
      <div className="bg-white border-b-2 border-primary px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded border border-primary/20 bg-primary/5 flex items-center justify-center text-primary font-bold">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-primary">NexTrial</div>
              <p className="text-xs text-text-muted">Clinical Trial Management System for Ayurvedic Research</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-secondary border border-blue-200 rounded hidden sm:inline">
            SIH PS 26046 Aligned
          </span>
        </div>
      </div>

      {/* Centered Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white border border-border rounded-[4px] shadow-sm max-w-md w-full p-6 sm:p-8 space-y-6">
          <div className="border-b border-border pb-4 text-center">
            <h1 className="text-2xl font-bold text-primary">Portal Login</h1>
            <p className="text-xs text-text-muted mt-1">
              Authorized clinical researchers and ethics committee members
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-status-danger px-4 py-3 rounded-[4px] text-xs flex items-start gap-2" role="alert">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email-input" className="block text-xs font-bold text-text-main">
                Email Address <span className="text-status-danger">* (required)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nextrial.org"
                  className="w-full h-10 pl-9 pr-3 rounded-[4px] border border-border focus:border-secondary focus:ring-1 focus:ring-secondary text-sm text-text-main"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password-input" className="block text-xs font-bold text-text-main">
                Account Password <span className="text-status-danger">* (required)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                <input
                  id="password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 pl-9 pr-3 rounded-[4px] border border-border focus:border-secondary focus:ring-1 focus:ring-secondary text-sm text-text-main"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-[4px] flex items-center justify-center gap-2 transition"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-fill role credentials for testing */}
          <div className="pt-4 border-t border-border space-y-2">
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider text-center">
              Quick Role Sign-In (Prototype Evaluator Shortcuts):
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin@nextrial.org', 'Admin@NexTrial2026!')}
                className="p-1.5 border border-border bg-slate-50 hover:bg-blue-50 text-left rounded text-text-main font-medium"
              >
                👤 <strong>Admin</strong>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('coordinator@nextrial.org', 'Coordinator@NexTrial2026!')}
                className="p-1.5 border border-border bg-slate-50 hover:bg-blue-50 text-left rounded text-text-main font-medium"
              >
                📋 <strong>Coordinator</strong>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('investigator@nextrial.org', 'Investigator@NexTrial2026!')}
                className="p-1.5 border border-border bg-slate-50 hover:bg-blue-50 text-left rounded text-text-main font-medium"
              >
                🩺 <strong>Investigator</strong>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('iec@nextrial.org', 'IECMember@NexTrial2026!')}
                className="p-1.5 border border-border bg-slate-50 hover:bg-blue-50 text-left rounded text-text-main font-medium"
              >
                ⚖️ <strong>IEC Member</strong>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('pvofficer@nextrial.org', 'PVOfficer@NexTrial2026!')}
                className="p-1.5 border border-border bg-slate-50 hover:bg-blue-50 text-left rounded text-text-main font-medium"
              >
                💊 <strong>PV Officer</strong>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('dsmb@nextrial.org', 'DSMBReviewer@NexTrial2026!')}
                className="p-1.5 border border-border bg-slate-50 hover:bg-blue-50 text-left rounded text-text-main font-medium"
              >
                📊 <strong>DSMB Chair</strong>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-text-muted">
            Forgot password? Contact your administrator.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-4 px-6 text-center text-xs text-text-muted">
        Academic prototype. Not an official Government of India website.
      </footer>
    </div>
  );
}
