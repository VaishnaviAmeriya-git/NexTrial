import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  Layers,
  Users,
  AlertTriangle,
  ShieldAlert,
  FileSpreadsheet,
  Settings,
  LogOut,
  Type,
  Globe,
  Bell,
  Menu,
  X,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import i18nData from '../i18n.json';

export default function PageFrame({ children, breadcrumbs = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [fontSize, setFontSize] = useState(() => localStorage.getItem('nextrial_fontsize') || '16px');
  const [lang, setLang] = useState(() => localStorage.getItem('nextrial_lang') || 'EN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = i18nData[lang] || i18nData.EN;

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-base', fontSize);
    localStorage.setItem('nextrial_fontsize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('nextrial_lang', lang);
  }, [lang]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Role-based navigation items
  const role = user?.role || 'coordinator';
  const navItems = [
    { to: '/dashboard', label: t.dashboard, icon: Activity, roles: ['admin', 'coordinator', 'investigator', 'iec_member', 'pv_officer', 'dsmb'] },
    { to: '/trials', label: t.trials, icon: Layers, roles: ['admin', 'coordinator', 'investigator', 'iec_member', 'pv_officer', 'dsmb'] },
    { to: '/participants', label: t.participants, icon: Users, roles: ['admin', 'coordinator', 'investigator'] },
    { to: '/at-risk', label: t.atRiskWorklist, icon: ShieldAlert, roles: ['admin', 'coordinator', 'investigator'] },
    { to: '/safety', label: t.safetyReports, icon: AlertTriangle, roles: ['admin', 'coordinator', 'investigator', 'pv_officer', 'dsmb'] },
    { to: '/alerts', label: t.alertsCenter, icon: Bell, roles: ['admin', 'coordinator', 'investigator', 'iec_member', 'pv_officer', 'dsmb'] },
    { to: '/exports', label: t.exports, icon: FileSpreadsheet, roles: ['admin', 'coordinator', 'investigator', 'dsmb'] },
    { to: '/admin', label: t.admin, icon: Settings, roles: ['admin'] },
  ].filter(item => item.roles.includes(role));

  return (
    <div className="min-h-screen flex flex-col bg-surface-page text-text-main">
      {/* 1. Thin 4px Saffron Accent Strip */}
      <div className="h-1 bg-saffron w-full" role="presentation" />

      {/* 2. Persistent Notice Bar */}
      <div className="bg-amber-100 border-b border-amber-300 px-4 py-1.5 text-xs text-amber-900 font-medium flex items-center justify-center gap-2 text-center">
        <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
        <span>{t.notice}</span>
      </div>

      {/* 3. Utility Bar */}
      <header className="bg-slate-100 border-b border-border text-xs px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a
            href="#main-content"
            className="text-primary font-medium hover:underline focus:bg-white focus:p-1 rounded"
          >
            {t.skipToContent}
          </a>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Font Size Controls */}
            <div className="flex items-center gap-1 border border-border bg-white rounded px-1.5 py-0.5">
              <span className="text-text-muted mr-1 hidden sm:flex items-center gap-1">
                <Type className="w-3 h-3" /> Size:
              </span>
              <button
                onClick={() => setFontSize('14px')}
                className={`px-1.5 rounded text-xs font-semibold ${fontSize === '14px' ? 'bg-primary text-white' : 'hover:bg-slate-200 text-text-main'}`}
                title="Decrease font size"
                aria-label="Decrease text size"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('16px')}
                className={`px-1.5 rounded text-xs font-semibold ${fontSize === '16px' ? 'bg-primary text-white' : 'hover:bg-slate-200 text-text-main'}`}
                title="Default font size"
                aria-label="Default text size"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('18px')}
                className={`px-1.5 rounded text-xs font-semibold ${fontSize === '18px' ? 'bg-primary text-white' : 'hover:bg-slate-200 text-text-main'}`}
                title="Increase font size"
                aria-label="Increase text size"
              >
                A+
              </button>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center gap-1 border border-border bg-white rounded px-1.5 py-0.5">
              <Globe className="w-3 h-3 text-text-muted" />
              <button
                onClick={() => setLang('EN')}
                className={`px-1.5 rounded text-xs font-semibold ${lang === 'EN' ? 'bg-secondary text-white' : 'hover:bg-slate-200 text-text-main'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('HI')}
                className={`px-1.5 rounded text-xs font-semibold ${lang === 'HI' ? 'bg-secondary text-white' : 'hover:bg-slate-200 text-text-main'}`}
              >
                हिन्दी
              </button>
            </div>

            {/* User Details & Logout */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="font-semibold text-text-main leading-tight">{user.name}</div>
                  <div className="text-[11px] text-text-muted uppercase tracking-wider font-bold">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white border border-border hover:bg-slate-50 text-status-danger rounded font-semibold text-xs transition"
                  title="Sign out of system"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.logout}</span>
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 rounded border border-border bg-white text-primary"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 4. Portal Header Banner */}
      <div className="bg-white border-b-2 border-primary px-6 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Neutral Placeholder Logo */}
            <div className="w-11 h-11 rounded border border-primary/20 bg-primary/5 flex items-center justify-center text-primary font-bold shadow-sm">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-primary">
                  {t.appTitle}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 text-secondary border border-blue-200 rounded">
                  SIH PS 26046
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-muted font-medium">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-status-success" />
              <span>GCP-Aligned Prototype</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-secondary" />
              <span>SDTM & FHIR R4 Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-slate-100/80 border-b border-border px-6 py-2 text-xs text-text-muted">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 flex-wrap">
          <NavLink to="/dashboard" className="font-semibold text-primary hover:underline">
            Home
          </NavLink>
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              <span>&gt;</span>
              {bc.to ? (
                <NavLink to={bc.to} className="text-primary hover:underline">
                  {bc.label}
                </NavLink>
              ) : (
                <span className="text-text-main font-semibold">{bc.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Main Layout Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* 5. Navigation Sidebar in Navy (240px wide) */}
        <aside
          className={`w-full md:w-60 bg-primary text-white flex-shrink-0 p-3.5 border-r border-border md:block ${
            mobileMenuOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider text-slate-300 font-bold mb-3 px-2">
            Navigation Menu
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-r-[4px] text-sm font-medium transition ${
                      isActive
                        ? 'bg-primary-hover border-l-4 border-saffron text-white font-semibold shadow-inner'
                        : 'text-slate-200 hover:bg-primary-hover/70 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Dynamic Main Body Content */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* 7. Institutional Footer */}
      <footer className="bg-white border-t border-border mt-auto py-5 px-6 text-xs text-text-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="#" className="hover:text-primary hover:underline">Help & Guidance</a>
            <span>|</span>
            <a href="#" className="hover:text-primary hover:underline">Accessibility Statement (WCAG 2.1 AA)</a>
            <span>|</span>
            <a href="#" className="hover:text-primary hover:underline">Terms of Use</a>
            <span>|</span>
            <a href="#" className="hover:text-primary hover:underline">Contact System Administrator</a>
          </div>
          <div className="text-right">
            <div>
              App Version: <strong>v1.0.0</strong> | ML Model: <strong>v1.0-rf</strong> | Last updated: <strong>Nov 2026</strong>
            </div>
            <div className="text-[11px] text-text-muted/80 mt-0.5">
              Academic prototype. Not an official Government of India website.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
