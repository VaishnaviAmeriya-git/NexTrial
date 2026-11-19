import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  PhoneCall,
  ArrowRight,
  TrendingUp,
  Brain,
  AlertTriangle
} from 'lucide-react';
import apiClient from '../api/client';
import PageFrame from '../components/PageFrame';
import StatusBadge from '../components/StatusBadge';

export default function AtRiskWorklistPage() {
  const [participants, setParticipants] = useState([]);
  const [trials, setTrials] = useState([]);
  const [selectedTrial, setSelectedTrial] = useState('');
  const [bandFilter, setBandFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trRes, partRes] = await Promise.all([
          apiClient.get('/trials'),
          apiClient.get('/trials'),
        ]);

        const trialList = trRes.data?.data || [];
        setTrials(trialList);

        // Fetch participants across all trials
        const all = [];
        for (const tr of trialList) {
          const res = await apiClient.get(`/trials/${tr._id}/participants`);
          if (res.data?.data) {
            all.push(...res.data.data.map(p => ({ ...p, trialShortCode: tr.shortCode })));
          }
        }

        // Sort: High risk first, then Medium, then Low
        const sorted = all.sort((a, b) => {
          const bandWeight = { High: 3, Medium: 2, Low: 1, Unknown: 0 };
          const aWeight = bandWeight[a.latestRisk?.band] || 0;
          const bWeight = bandWeight[b.latestRisk?.band] || 0;
          if (bWeight !== aWeight) return bWeight - aWeight;
          return (b.latestRisk?.probability || 0) - (a.latestRisk?.probability || 0);
        });

        setParticipants(sorted);
      } catch (err) {
        console.error('Failed to load at-risk worklist:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = participants.filter((p) => {
    if (selectedTrial && p.trialId !== selectedTrial && p.trialId?._id !== selectedTrial) return false;
    if (bandFilter && p.latestRisk?.band !== bandFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.subjectId.toLowerCase().includes(q) ||
        p.trialShortCode?.toLowerCase().includes(q) ||
        p.ayurveda?.ayurvedicDiagnosis?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <PageFrame breadcrumbs={[{ label: 'Dropout Risk Worklist' }]}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-status-danger" />
            <h1 className="text-2xl font-bold text-primary">At-Risk Participant Worklist</h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Prioritized queue of participants exhibiting elevated dropout probability post Visit 3. High-risk subjects sorted first.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-border rounded-[4px] p-3 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subject ID, diagnosis..."
            className="w-full h-10 pl-9 pr-3 text-xs border border-border rounded-[4px] focus:outline-none focus:border-secondary"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedTrial}
            onChange={(e) => setSelectedTrial(e.target.value)}
            className="h-10 px-3 text-xs border border-border rounded-[4px] bg-slate-50 focus:outline-none"
          >
            <option value="">All Trials</option>
            {trials.map((t) => (
              <option key={t._id} value={t._id}>
                {t.shortCode}
              </option>
            ))}
          </select>

          <select
            value={bandFilter}
            onChange={(e) => setBandFilter(e.target.value)}
            className="h-10 px-3 text-xs border border-border rounded-[4px] bg-slate-50 focus:outline-none"
          >
            <option value="">All Risk Bands</option>
            <option value="High">▲ High Risk (≥60%)</option>
            <option value="Medium">● Medium Risk (30-59%)</option>
            <option value="Low">▼ Low Risk (&lt;30%)</option>
          </select>
        </div>
      </div>

      {/* At-Risk Table */}
      <div className="bg-white border border-border rounded-[4px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-zebra">
            <thead className="bg-slate-100 border-b border-border uppercase text-text-muted font-semibold">
              <tr>
                <th className="py-3 px-3">Subject ID</th>
                <th className="py-3 px-3">Trial</th>
                <th className="py-3 px-3">Age / Sex</th>
                <th className="py-3 px-3">Distance</th>
                <th className="py-3 px-3">Prakriti</th>
                <th className="py-3 px-3">Dropout Probability</th>
                <th className="py-3 px-3">Top SHAP Risk Driver</th>
                <th className="py-3 px-3 text-right">Outreach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-text-muted">
                    Loading at-risk cohort predictions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-text-muted">
                    No participants matched the selected risk filter.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const prob = p.latestRisk?.probability;
                  const pct = prob !== null && prob !== undefined ? Math.round(prob * 100) : null;
                  const topDriver = p.latestRisk?.topFactors?.[0];

                  return (
                    <tr
                      key={p._id}
                      className={p.latestRisk?.band === 'High' ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3 px-3 font-bold font-mono text-primary">
                        {p.subjectId}
                      </td>
                      <td className="py-3 px-3 font-semibold text-text-muted">
                        {p.trialShortCode}
                      </td>
                      <td className="py-3 px-3">
                        {p.age}y / {p.sex}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium">
                        {p.distanceKm} km
                      </td>
                      <td className="py-3 px-3 capitalize font-semibold text-secondary">
                        {p.ayurveda?.prakriti}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={p.latestRisk?.band || 'Low'} />
                          {pct !== null && (
                            <span className="font-mono font-bold text-text-main text-[11px]">
                              {pct}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-text-muted">
                        {topDriver ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-text-main block">
                              {topDriver.label || topDriver.feature}
                            </span>
                            <span className="text-[10px] text-status-danger font-medium">
                              +{Math.round((topDriver.contribution || 0.1) * 100)}% risk impact
                            </span>
                          </div>
                        ) : (
                          <span className="italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <NavLink
                          to={`/participants/${p._id}`}
                          className="px-2.5 py-1 bg-white border border-border hover:bg-slate-100 text-primary font-bold rounded text-[11px] inline-flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </NavLink>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageFrame>
  );
}
