import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Layers,
  Users,
  AlertTriangle,
  ShieldCheck,
  Activity,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import apiClient from '../api/client';
import PageFrame from '../components/PageFrame';
import StatusBadge from '../components/StatusBadge';
import TrialHealthScoreGauge from '../components/TrialHealthScoreGauge';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [trials, setTrials] = useState([]);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [trialsRes, alertsRes] = await Promise.all([
          apiClient.get('/trials'),
          apiClient.get('/alerts?status=open'),
        ]);

        const trialList = trialsRes.data?.data || [];
        setTrials(trialList);
        setAlerts(alertsRes.data?.data || []);

        if (trialList.length > 0) {
          const firstTrial = trialList[0];
          setSelectedTrial(firstTrial);
          const healthRes = await apiClient.get(`/trials/${firstTrial._id}/health-score`);
          setHealthScore(healthRes.data?.data || null);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const handleTrialChange = async (trialId) => {
    const t = trials.find(x => x._id === trialId);
    if (!t) return;
    setSelectedTrial(t);
    try {
      const res = await apiClient.get(`/trials/${t._id}/health-score`);
      setHealthScore(res.data?.data || null);
    } catch (e) {
      console.warn('Failed to load health score:', e);
    }
  };

  // Aggregated KPIs
  const totalEnrolled = trials.reduce((acc, t) => acc + (t.targetEnrollment || 0), 0);
  const activeTrialsCount = trials.filter(t => t.status === 'Active').length;

  // Static/synthetic chart distributions
  const riskDistributionData = [
    { name: 'Low Risk', count: 185, color: '#1E7B45' },
    { name: 'Medium Risk', count: 72, color: '#B26A00' },
    { name: 'High Risk', count: 43, color: '#B3261E' },
  ];

  const enrollmentTrendData = [
    { month: 'Jun', target: 20, actual: 18 },
    { month: 'Jul', target: 45, actual: 42 },
    { month: 'Aug', target: 75, actual: 79 },
    { month: 'Sep', target: 110, actual: 108 },
    { month: 'Oct', target: 145, actual: 154 },
    { month: 'Nov', target: 180, actual: 192 },
  ];

  return (
    <PageFrame breadcrumbs={[{ label: 'Executive Dashboard' }]}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            AIIA Clinical Trials Monitoring Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Real-time portfolio oversight, GCP health scores, explainable dropout prediction, and regulatory safety clocks.
          </p>
        </div>

        {/* Trial Selector Dropdown */}
        {trials.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-border rounded-[4px] p-1.5 shadow-sm">
            <span className="text-xs font-bold text-text-muted px-2">Focus Trial:</span>
            <select
              value={selectedTrial?._id || ''}
              onChange={(e) => handleTrialChange(e.target.value)}
              className="text-xs font-semibold text-primary bg-slate-50 border border-border rounded px-2.5 py-1 focus:outline-none"
            >
              {trials.map((tr) => (
                <option key={tr._id} value={tr._id}>
                  {tr.shortCode} - {tr.title.slice(0, 38)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Role-based KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-[4px] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-text-muted">Total Trials</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-primary mt-2 font-mono">
            {trials.length}
          </div>
          <p className="text-xs text-text-muted mt-1">
            <span className="text-status-success font-semibold">{activeTrialsCount} Active</span> • 1 IEC Pending • 1 CTRI Reg
          </p>
        </div>

        <div className="bg-white border border-border rounded-[4px] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-text-muted">Total Participants</span>
            <Users className="w-4 h-4 text-secondary" />
          </div>
          <div className="text-2xl font-extrabold text-primary mt-2 font-mono">
            300
          </div>
          <p className="text-xs text-text-muted mt-1">
            Across 3 Ayurvedic clinical cohorts
          </p>
        </div>

        <div className="bg-white border border-border rounded-[4px] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-text-muted">High Dropout Risk</span>
            <ShieldCheck className="w-4 h-4 text-status-danger" />
          </div>
          <div className="text-2xl font-extrabold text-status-danger mt-2 font-mono">
            43
          </div>
          <p className="text-xs text-text-muted mt-1">
            Participants flagged after Visit 3 (SHAP attribution)
          </p>
        </div>

        <div className="bg-white border border-border rounded-[4px] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-text-muted">Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-status-warning" />
          </div>
          <div className="text-2xl font-extrabold text-status-warning mt-2 font-mono">
            {alerts.length}
          </div>
          <p className="text-xs text-text-muted mt-1">
            2 SAE clocks • 1 IEC expiry • 1 Overdue query
          </p>
        </div>
      </div>

      {/* Trial Health Score Component */}
      <TrialHealthScoreGauge healthData={healthScore} />

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-base font-bold text-primary">Cohort Dropout Risk Stratification</h3>
              <p className="text-xs text-text-muted">Calibrated Random Forest predictions post Visit 3</p>
            </div>
            <NavLink to="/at-risk" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>Worklist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
          <div className="h-60 w-full" aria-label="Participant risk distribution bar chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val) => [`${val} participants`, 'Count']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D0D7DE', borderRadius: 4, fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-text-muted bg-slate-50 p-2 rounded">
            <strong>Summary:</strong> 43 participants (14.3%) meet the high-risk criteria (&ge; 60% probability) and are routed to coordinator outreach worklists.
          </div>
        </div>

        {/* Enrollment Trend Chart */}
        <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-base font-bold text-primary">Cumulative Enrollment Velocity</h3>
              <p className="text-xs text-text-muted">Target planned trajectory vs actual recruited subjects</p>
            </div>
          </div>
          <div className="h-60 w-full" aria-label="Enrollment trajectory chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D0D7DE', borderRadius: 4, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="target" name="Target Planned" fill="#94A3B8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="actual" name="Actual Enrolled" fill="#1F3A5F" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-text-muted bg-slate-50 p-2 rounded">
            <strong>Summary:</strong> Cohort recruitment is progressing at 106% of planned velocity, yielding an enrollment term (E) of 1.000 in THS.
          </div>
        </div>
      </div>

      {/* Trial Portfolio Table */}
      <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold text-primary">Trial Portfolio</h3>
            <p className="text-xs text-text-muted">Active and regulatory pending Ayurvedic clinical studies</p>
          </div>
          <NavLink
            to="/trials"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Trials</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="overflow-x-auto border border-border rounded-[4px]">
          <table className="w-full text-left text-sm table-zebra">
            <thead className="bg-slate-100 border-b border-border text-xs uppercase text-text-muted font-semibold">
              <tr>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Condition & Title</th>
                <th className="py-2.5 px-3">Formulation</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {trials.map((tr) => (
                <tr key={tr._id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-primary font-mono">{tr.shortCode}</td>
                  <td className="py-2.5 px-3 font-semibold text-text-main max-w-xs truncate">
                    {tr.title}
                  </td>
                  <td className="py-2.5 px-3 text-text-muted">{tr.formulation}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={tr.status} />
                  </td>
                  <td className="py-2.5 px-3 font-mono">{tr.targetEnrollment}</td>
                  <td className="py-2.5 px-3 text-right">
                    <NavLink
                      to={`/trials/${tr._id}`}
                      className="px-2.5 py-1 bg-white border border-border hover:bg-slate-50 text-primary font-bold rounded text-xs inline-block"
                    >
                      View
                    </NavLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live System Alert Feed (Latest 10) */}
      <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-status-warning" />
            <h3 className="text-base font-bold text-primary">Live Regulatory & Protocol Alerts</h3>
          </div>
          <NavLink to="/alerts" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>View All Alerts ({alerts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {alerts.length === 0 ? (
          <p className="text-xs text-text-muted italic py-3">No active alerts requiring attention.</p>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alt) => (
              <div
                key={alt._id}
                className={`p-3 rounded-[4px] border text-xs flex items-start justify-between gap-3 ${
                  alt.severity === 'danger'
                    ? 'bg-red-50 border-red-300 text-status-danger'
                    : 'bg-amber-50 border-amber-300 text-status-warning'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                      {alt.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-text-main font-medium">{alt.message}</span>
                  </div>
                </div>
                <NavLink
                  to="/alerts"
                  className="px-2 py-0.5 bg-white border border-border text-primary hover:bg-slate-50 rounded text-[11px] font-bold flex-shrink-0"
                >
                  Review
                </NavLink>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageFrame>
  );
}
