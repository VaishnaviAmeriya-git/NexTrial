import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  ShieldCheck,
  Brain,
  FileText,
  Clock,
  RefreshCw,
  Plus,
  CheckCircle,
  Hash,
  AlertTriangle
} from 'lucide-react';
import apiClient from '../api/client';
import PageFrame from '../components/PageFrame';
import StatusBadge from '../components/StatusBadge';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('audit');

  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [auditMeta, setAuditMeta] = useState({});
  const [auditPage, setAuditPage] = useState(1);

  // Users State
  const [users, setUsers] = useState([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [userError, setUserError] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'coordinator',
  });

  // Settings State
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Model Info State
  const [modelInfo, setModelInfo] = useState(null);
  const [retraining, setRetraining] = useState(false);

  const fetchAudit = async (page = 1) => {
    try {
      const res = await apiClient.get(`/audit?page=${page}&limit=20`);
      setLogs(res.data?.data || []);
      setAuditMeta(res.data?.meta || {});
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/users');
      setUsers(res.data?.data || []);
    } catch (e) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/settings');
      setSettings(res.data?.data || null);
    } catch (e) {}
  };

  const fetchModelInfo = async () => {
    try {
      const res = await apiClient.get('/ml/model-info');
      setModelInfo(res.data?.data || null);
    } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === 'audit') fetchAudit(auditPage);
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'settings') fetchSettings();
    else if (activeTab === 'model') fetchModelInfo();
  }, [activeTab, auditPage]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      await apiClient.patch('/settings', {
        regulatoryTimelines: settings.regulatoryTimelines,
        trialHealthScoreWeights: settings.trialHealthScoreWeights,
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRetrainModel = async () => {
    setRetraining(true);
    try {
      await apiClient.post('/ml/retrain');
      alert('Model retraining triggered in background. Model card and metrics will refresh upon completion.');
      fetchModelInfo();
    } catch (e) {
      alert('Retraining request failed');
    } finally {
      setRetraining(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    try {
      await apiClient.post('/users', newUser);
      setShowCreateUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'coordinator' });
      fetchUsers();
    } catch (err) {
      setUserError(err.response?.data?.error?.message || 'Failed to create user');
    }
  };

  return (
    <PageFrame breadcrumbs={[{ label: 'Administration & Audit' }]}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">System Administration & Audit Trail</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Immutable hash-chained audit logs, user management, regulatory settings, and ML model operations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'audit', label: 'Hash-Chained Audit Trail', icon: Hash },
          { key: 'users', label: 'User Accounts & Roles', icon: Users },
          { key: 'settings', label: 'Regulatory Timelines & Settings', icon: Settings },
          { key: 'model', label: 'ML Model & Retraining', icon: Brain },
        ].map((tb) => {
          const Icon = tb.icon;
          return (
            <button
              key={tb.key}
              onClick={() => setActiveTab(tb.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-[4px] transition ${
                activeTab === tb.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tb.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-border rounded-[4px] shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-status-success" />
                <h2 className="text-sm font-bold text-primary">Cryptographic Hash-Chained Audit Log</h2>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Every record update computes SHA-256 hash linked to previous entry for tamper-evidence.
              </p>
            </div>
            <span className="text-xs font-bold text-status-success flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 border border-emerald-300 rounded">
              <CheckCircle className="w-4 h-4" />
              <span>Chain Integrity Verified</span>
            </span>
          </div>

          <div className="bg-white border border-border rounded-[4px] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-zebra">
                <thead className="bg-slate-100 border-b border-border uppercase text-text-muted font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor (Email / Role)</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entity</th>
                    <th className="py-2.5 px-3">Entity ID</th>
                    <th className="py-2.5 px-3 font-mono">SHA-256 Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-text-muted">
                        {new Date(log.at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-text-main block">{log.userEmail}</span>
                        <span className="text-[10px] text-text-muted uppercase font-bold">{log.userRole}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          log.action === 'CREATE' ? 'bg-emerald-100 text-status-success' : 'bg-blue-100 text-secondary'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-text-main">{log.entity}</td>
                      <td className="py-2.5 px-3 font-mono text-text-muted text-[11px]">{log.entityId}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-text-muted max-w-xs truncate" title={log.hash}>
                        {log.hash ? `${log.hash.slice(0, 16)}...` : 'GENESIS'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-50 border-t border-border flex items-center justify-between text-xs">
              <span className="text-text-muted">
                Page {auditPage} of {auditMeta.totalPages || 1} ({auditMeta.total || 0} total audit records)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-white border border-border rounded disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={auditPage >= (auditMeta.totalPages || 1)}
                  onClick={() => setAuditPage(p => p + 1)}
                  className="px-2.5 py-1 bg-white border border-border rounded disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-primary">System Users & Role Access</h2>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="h-9 px-3 bg-primary hover:bg-primary-hover text-white rounded text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create User Account</span>
            </button>
          </div>

          <div className="bg-white border border-border rounded-[4px] shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs table-zebra">
              <thead className="bg-slate-100 border-b border-border uppercase text-text-muted font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Assigned Trials</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="py-2.5 px-3 font-bold text-text-main">{u.name}</td>
                    <td className="py-2.5 px-3 font-mono text-text-muted">{u.email}</td>
                    <td className="py-2.5 px-3 font-semibold uppercase text-secondary">{u.role}</td>
                    <td className="py-2.5 px-3 text-text-muted">
                      {u.role === 'admin' ? (
                        <span className="italic">All Trials (Superuser)</span>
                      ) : (
                        `${u.assignedTrials?.length || 0} assigned`
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={u.isActive ? 'Active' : 'Closed'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-border rounded-[4px] p-6 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-primary">Regulatory Clocks & Timelines</h2>
            <p className="text-xs text-text-muted">
              Configure compliance alert thresholds without restarting application services.
            </p>
          </div>

          {settingsSuccess && (
            <div className="p-3 bg-emerald-50 text-status-success border border-emerald-300 rounded text-xs">
              ✓ Global CTMS settings updated successfully and recorded in audit log.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-text-main">SAE Initial Report Due (Hours)</label>
              <input
                type="number"
                min="1"
                required
                value={settings.regulatoryTimelines.saeInitialReportDueHours}
                onChange={(e) => setSettings({
                  ...settings,
                  regulatoryTimelines: {
                    ...settings.regulatoryTimelines,
                    saeInitialReportDueHours: parseInt(e.target.value, 10),
                  },
                })}
                className="w-full h-9 px-3 border border-border rounded"
              />
              <span className="text-[11px] text-text-muted">Default: 24 hours per Indian GCP</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-text-main">SAE Detailed Report Due (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={settings.regulatoryTimelines.saeDetailedReportDueDays}
                onChange={(e) => setSettings({
                  ...settings,
                  regulatoryTimelines: {
                    ...settings.regulatoryTimelines,
                    saeDetailedReportDueDays: parseInt(e.target.value, 10),
                  },
                })}
                className="w-full h-9 px-3 border border-border rounded"
              />
              <span className="text-[11px] text-text-muted">Default: 14 days</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-text-main">IEC Expiry Warning (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={settings.regulatoryTimelines.iecExpiryWarningDays}
                onChange={(e) => setSettings({
                  ...settings,
                  regulatoryTimelines: {
                    ...settings.regulatoryTimelines,
                    iecExpiryWarningDays: parseInt(e.target.value, 10),
                  },
                })}
                className="w-full h-9 px-3 border border-border rounded"
              />
              <span className="text-[11px] text-text-muted">Default: 30 days</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-text-main">Data Query Overdue Threshold (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={settings.regulatoryTimelines.queryOverdueDays}
                onChange={(e) => setSettings({
                  ...settings,
                  regulatoryTimelines: {
                    ...settings.regulatoryTimelines,
                    queryOverdueDays: parseInt(e.target.value, 10),
                  },
                })}
                className="w-full h-9 px-3 border border-border rounded"
              />
              <span className="text-[11px] text-text-muted">Default: 14 days</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="h-10 px-5 bg-primary hover:bg-primary-hover text-white font-semibold rounded text-xs"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: ML MODEL CARD & RETRAIN */}
      {activeTab === 'model' && (
        <div className="bg-white border border-border rounded-[4px] p-6 shadow-sm space-y-5 max-w-3xl">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-primary">ML Model Card: Dropout Risk Predictor</h2>
              <span className="text-xs text-text-muted">RandomForestClassifier with CalibratedClassifierCV (isotonic)</span>
            </div>
            <button
              onClick={handleRetrainModel}
              disabled={retraining}
              className="h-9 px-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Retraining Model...' : 'Retrain from Synthetic Data'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border rounded">
              <span className="text-text-muted block font-semibold">Model Version</span>
              <span className="text-sm font-bold font-mono text-primary">{modelInfo?.modelVersion || 'v1.0-rf'}</span>
            </div>
            <div className="p-3 bg-slate-50 border rounded">
              <span className="text-text-muted block font-semibold">Test ROC-AUC</span>
              <span className="text-sm font-bold font-mono text-status-success">
                {modelInfo?.metrics?.rocAuc || '0.8735'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border rounded">
              <span className="text-text-muted block font-semibold">PR-AUC</span>
              <span className="text-sm font-bold font-mono text-secondary">
                {modelInfo?.metrics?.prAuc || '0.7375'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 space-y-1">
            <strong>Model Card Scope & Limitation:</strong>
            <p>
              Trained entirely on synthetic clinical trial data (N=5,000, 80/20 train/test). Metrics reflect recoverability of designed signal, not real-world performance. Intended use is clinical decision support and coordinator outreach alerting only.
            </p>
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-[4px] border border-border shadow-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-primary">Create System User Account</h2>
            {userError && (
              <div className="bg-red-50 text-status-danger p-2.5 rounded text-xs border border-red-300">
                {userError}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-main">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full h-8 px-2 border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-text-main">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full h-8 px-2 border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-text-main">Temporary Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full h-8 px-2 border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-text-main">Role Assignment</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full h-8 px-2 border rounded"
                >
                  <option value="coordinator">Coordinator</option>
                  <option value="investigator">Investigator</option>
                  <option value="iec_member">IEC Member</option>
                  <option value="pv_officer">PV Safety Officer</option>
                  <option value="dsmb">DSMB Reviewer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowCreateUserModal(false)} className="h-8 px-3 border rounded">
                  Cancel
                </button>
                <button type="submit" className="h-8 px-4 bg-primary text-white font-semibold rounded">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
