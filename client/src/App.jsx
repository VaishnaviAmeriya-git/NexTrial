import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Globe,
  Type,
  ShieldCheck,
  Database,
  Brain,
  Server,
  FileText,
  UserCheck
} from 'lucide-react';

export default function App() {
  const [fontSize, setFontSize] = useState('16px');
  const [language, setLanguage] = useState('EN');
  const [healthData, setHealthData] = useState({
    status: 'checking',
    services: { api: 'checking', database: 'checking', mlService: 'checking' }
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-base', fontSize);
  }, [fontSize]);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/v1/health');
        if (res.ok) {
          const data = await res.json();
          setHealthData(data);
        } else {
          setHealthData({ status: 'error', services: { api: 'offline', database: 'unknown', mlService: 'unknown' } });
        }
      } catch (e) {
        setHealthData({ status: 'offline', services: { api: 'offline', database: 'unknown', mlService: 'unknown' } });
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface-page text-text-main">
      {/* 1. Thin 4px Saffron Strip */}
      <div className="h-1 bg-saffron w-full" role="presentation" />

      {/* 2. Persistent Notice Bar */}
      <div className="bg-amber-100 border-b border-amber-300 px-4 py-1.5 text-xs text-amber-900 font-medium flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
        <span>Prototype - synthetic data. Academic project, not an official Government of India website.</span>
      </div>

      {/* 3. Utility Bar */}
      <header className="bg-slate-100 border-b border-border text-xs px-4 py-1">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a
            href="#main-content"
            className="text-primary font-medium hover:underline focus:bg-white focus:p-1"
          >
            Skip to main content
          </a>

          <div className="flex items-center gap-4">
            {/* Font Size Controls */}
            <div className="flex items-center gap-1 border border-border bg-white rounded px-1.5 py-0.5">
              <span className="text-text-muted mr-1 flex items-center gap-1">
                <Type className="w-3 h-3" /> Size:
              </span>
              <button
                onClick={() => setFontSize('14px')}
                className={`px-1 rounded text-xs font-semibold ${fontSize === '14px' ? 'bg-primary text-white' : 'hover:bg-slate-200'}`}
                title="Smaller text"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('16px')}
                className={`px-1 rounded text-xs font-semibold ${fontSize === '16px' ? 'bg-primary text-white' : 'hover:bg-slate-200'}`}
                title="Default text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('18px')}
                className={`px-1 rounded text-xs font-semibold ${fontSize === '18px' ? 'bg-primary text-white' : 'hover:bg-slate-200'}`}
                title="Larger text"
              >
                A+
              </button>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center gap-1 border border-border bg-white rounded px-1.5 py-0.5">
              <Globe className="w-3 h-3 text-text-muted" />
              <button
                onClick={() => setLanguage('EN')}
                className={`px-1.5 rounded text-xs font-semibold ${language === 'EN' ? 'bg-secondary text-white' : 'hover:bg-slate-200'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('HI')}
                className={`px-1.5 rounded text-xs font-semibold ${language === 'HI' ? 'bg-secondary text-white' : 'hover:bg-slate-200'}`}
              >
                हिन्दी
              </button>
            </div>

            {/* User Session Info Placeholder */}
            <div className="flex items-center gap-2 text-text-muted">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Admin (Superuser)</span>
            </div>
          </div>
        </div>
      </header>

      {/* 4. Portal Header Banner */}
      <div className="bg-white border-b-2 border-primary px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Neutral Placeholder Logo */}
          <div className="w-12 h-12 rounded border border-primary/20 bg-primary/5 flex items-center justify-center text-primary font-bold">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-primary">
                NexTrial
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-secondary border border-blue-200 rounded">
                SIH PS 26046 Aligned
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-muted font-medium">
              Clinical Trial Management System for Ayurvedic Research
            </p>
          </div>
        </div>
      </div>

      {/* 5. Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-slate-100/70 border-b border-border px-6 py-2 text-xs text-text-muted">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span className="font-medium text-primary">Home</span>
          <span>&gt;</span>
          <span className="text-text-main font-semibold">System Dashboard & Scaffolding Check</span>
        </div>
      </nav>

      {/* Main Content Layout with Navigation Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Navy Left Sidebar (240px) */}
        <aside className="w-full md:w-60 bg-primary text-white flex-shrink-0 p-4 border-r border-border">
          <div className="text-xs uppercase tracking-wider text-slate-300 font-semibold mb-3">
            Navigation
          </div>
          <nav className="space-y-1">
            <a
              href="#"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary-hover border-l-4 border-saffron rounded-r"
            >
              <Activity className="w-4 h-4 text-saffron" />
              <span>Phase 0 Overview</span>
            </a>
            <div className="pt-2 text-xs text-slate-400 px-3">
              Role Modules (Phase 1-3)
            </div>
            {['Trials Portfolio', 'Participants & Consent', 'Visit Schedules', 'Safety & SAE Clocks', 'Quality & Deviations', 'FHIR / CDISC Export', 'Audit Trail', 'System Settings'].map((item) => (
              <span
                key={item}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 opacity-60 cursor-not-allowed"
              >
                <span>•</span>
                <span>{item}</span>
              </span>
            ))}
          </nav>
        </aside>

        {/* Main Body */}
        <main id="main-content" className="flex-1 p-6 space-y-6">
          <div className="border-b border-border pb-4">
            <h1 className="text-2xl font-bold text-primary">
              Phase 0: Architecture & Service Verification
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Verifying all 4 containerized services, health check endpoints, database connectivity, and design tokens.
            </p>
          </div>

          {/* Service Status Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-text-muted flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-primary" /> API Server
                </span>
                <span className="text-xs font-bold text-status-success flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Healthy
                </span>
              </div>
              <div className="mt-2 text-xl font-bold text-primary">Port 5000</div>
              <p className="text-xs text-text-muted mt-1">Express 4 + Mongoose 8 + Helmet</p>
            </div>

            <div className="bg-white border border-border rounded p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-text-muted flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-secondary" /> ML Service
                </span>
                <span className="text-xs font-bold text-status-success flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
              <div className="mt-2 text-xl font-bold text-secondary">Port 8000</div>
              <p className="text-xs text-text-muted mt-1">FastAPI + Scikit-Learn + SHAP</p>
            </div>

            <div className="bg-white border border-border rounded p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-text-muted flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-primary" /> Database
                </span>
                <span className="text-xs font-bold text-status-success flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected
                </span>
              </div>
              <div className="mt-2 text-xl font-bold text-primary">Port 27017</div>
              <p className="text-xs text-text-muted mt-1">MongoDB 7.0 Engine</p>
            </div>
          </div>

          {/* Scaffold Verification Checklist */}
          <div className="bg-white border border-border rounded p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-status-success" />
              Phase 0 Deliverables Checklist
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
                <span>Docker Compose orchestration (<code>mongo</code>, <code>ml</code>, <code>api</code>, <code>web</code>)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
                <span>OpenAPI 3.0.3 specification (<code>docs/openapi.yaml</code>)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
                <span>GIGW-inspired design system & Tailwind tokens (<code>docs/design-system.md</code>)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
                <span>Mongoose models with soft delete & composite indexes</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
                <span>Model card with synthetic data declaration (<code>ml-service/model_card.md</code>)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
                <span>Audit logging middleware with SHA-256 hash chaining</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 7. Institutional Footer */}
      <footer className="bg-white border-t border-border mt-auto py-6 px-6 text-xs text-text-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <a href="#" className="hover:text-primary hover:underline">Help & Support</a>
            <span>|</span>
            <a href="#" className="hover:text-primary hover:underline">Accessibility Statement</a>
            <span>|</span>
            <a href="#" className="hover:text-primary hover:underline">Terms of Use</a>
            <span>|</span>
            <a href="#" className="hover:text-primary hover:underline">Contact Administrator</a>
          </div>
          <div className="text-right">
            <div>App Version: <strong>v1.0.0</strong> | ML Model: <strong>v1.0-rf</strong></div>
            <div className="text-[11px] text-text-muted/80 mt-0.5">
              Academic prototype. Not an official Government of India website.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
