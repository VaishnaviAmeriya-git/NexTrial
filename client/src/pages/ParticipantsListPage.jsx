import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Search, Filter, Plus, ArrowRight } from 'lucide-react';
import apiClient from '../api/client';
import PageFrame from '../components/PageFrame';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function ParticipantsListPage() {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [trials, setTrials] = useState([]);
  const [selectedTrial, setSelectedTrial] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const trRes = await apiClient.get('/trials');
        const trialList = trRes.data?.data || [];
        setTrials(trialList);

        const all = [];
        for (const tr of trialList) {
          const res = await apiClient.get(`/trials/${tr._id}/participants`);
          if (res.data?.data) {
            all.push(...res.data.data.map(p => ({ ...p, trialShortCode: tr.shortCode })));
          }
        }
        setParticipants(all);
      } catch (err) {
        console.error('Failed to load participants:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = participants.filter((p) => {
    if (selectedTrial && p.trialId !== selectedTrial && p.trialId?._id !== selectedTrial) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.subjectId.toLowerCase().includes(q) ||
        p.trialShortCode?.toLowerCase().includes(q) ||
        p.ayurveda?.ayurvedicDiagnosis?.toLowerCase().includes(q) ||
        p.ayurveda?.formulation?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <PageFrame breadcrumbs={[{ label: 'Participants & Ayurveda' }]}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Participants & Ayurvedic Profiles</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Subject pseudonyms, baseline Prakriti constitutions, Dosha imbalances, and protocol statuses.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-border rounded-[4px] p-3 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subject ID, diagnosis, formulation..."
            className="w-full h-10 pl-9 pr-3 text-xs border border-border rounded-[4px] focus:outline-none focus:border-secondary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-xs border border-border rounded-[4px] bg-slate-50 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Enrolled">Enrolled</option>
            <option value="Completed">Completed</option>
            <option value="Withdrawn">Withdrawn</option>
            <option value="Lost to follow-up">Lost to follow-up</option>
            <option value="Screened">Screened</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-[4px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-zebra">
            <thead className="bg-slate-100 border-b border-border uppercase text-text-muted font-semibold">
              <tr>
                <th className="py-3 px-3">Subject ID</th>
                <th className="py-3 px-3">Trial</th>
                <th className="py-3 px-3">Age / Sex</th>
                <th className="py-3 px-3">Prakriti</th>
                <th className="py-3 px-3">Dosha Imbalance</th>
                <th className="py-3 px-3">Classical Formulation</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Risk Band</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-text-muted">
                    Loading participants...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-text-muted">
                    No participants found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold font-mono text-primary">{p.subjectId}</td>
                    <td className="py-3 px-3 font-medium text-text-muted">{p.trialShortCode}</td>
                    <td className="py-3 px-3">{p.age}y / {p.sex}</td>
                    <td className="py-3 px-3 capitalize font-semibold text-secondary">{p.ayurveda?.prakriti}</td>
                    <td className="py-3 px-3 text-text-muted">{(p.ayurveda?.doshaImbalance || []).join(', ')}</td>
                    <td className="py-3 px-3 font-medium text-text-main">{p.ayurveda?.formulation}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={p.latestRisk?.band || 'Low'} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <NavLink
                        to={`/participants/${p._id}`}
                        className="px-2.5 py-1 bg-white border border-border hover:bg-slate-50 text-primary font-bold rounded text-[11px] inline-flex items-center gap-1"
                      >
                        <span>Profile</span>
                        <ArrowRight className="w-3 h-3" />
                      </NavLink>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageFrame>
  );
}
