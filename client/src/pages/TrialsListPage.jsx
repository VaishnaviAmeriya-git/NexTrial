import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Search, Filter, Layers, CheckCircle } from 'lucide-react';
import apiClient from '../api/client';
import PageFrame from '../components/PageFrame';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function TrialsListPage() {
  const { user } = useAuth();
  const [trials, setTrials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for new trial
  const [formData, setFormData] = useState({
    title: '',
    shortCode: '',
    phase: 'Phase II',
    condition: '',
    formulation: '',
    design: 'Randomized, Double-Blind, Placebo-Controlled',
    targetEnrollment: 100,
    protocolVersion: '1.0',
  });
  const [createError, setCreateError] = useState('');

  const fetchTrials = async () => {
    setLoading(true);
    try {
      let url = '/trials';
      if (statusFilter) url += `?status=${statusFilter}`;
      const res = await apiClient.get(url);
      setTrials(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching trials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrials();
  }, [statusFilter]);

  const handleCreateTrial = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      await apiClient.post('/trials', {
        ...formData,
        targetEnrollment: parseInt(formData.targetEnrollment, 10),
      });
      setShowCreateModal(false);
      setFormData({
        title: '',
        shortCode: '',
        phase: 'Phase II',
        condition: '',
        formulation: '',
        design: 'Randomized, Double-Blind, Placebo-Controlled',
        targetEnrollment: 100,
        protocolVersion: '1.0',
      });
      fetchTrials();
    } catch (err) {
      setCreateError(err.response?.data?.error?.message || 'Failed to create trial');
    }
  };

  const filtered = trials.filter((tr) => {
    const q = searchTerm.toLowerCase();
    return (
      tr.shortCode.toLowerCase().includes(q) ||
      tr.title.toLowerCase().includes(q) ||
      tr.condition.toLowerCase().includes(q) ||
      tr.formulation.toLowerCase().includes(q)
    );
  });

  return (
    <PageFrame breadcrumbs={[{ label: 'Clinical Trials Portfolio' }]}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Clinical Trials Portfolio</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Overview of all Ayurvedic clinical trials, protocol phases, and regulatory stages.
          </p>
        </div>

        {['admin', 'coordinator'].includes(user?.role) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-10 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-[4px] flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Trial</span>
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-border rounded-[4px] p-3 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search trials by code, condition, formulation..."
            className="w-full h-10 pl-9 pr-3 text-xs border border-border rounded-[4px] focus:outline-none focus:border-secondary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-xs border border-border rounded-[4px] bg-slate-50 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="CTRI Registered">CTRI Registered</option>
            <option value="Approved">Approved</option>
            <option value="IEC Pending">IEC Pending</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Trials Table */}
      <div className="bg-white border border-border rounded-[4px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-zebra">
            <thead className="bg-slate-100 border-b border-border text-xs uppercase text-text-muted font-semibold">
              <tr>
                <th className="py-3 px-4">Trial Code</th>
                <th className="py-3 px-4">Title & Clinical Condition</th>
                <th className="py-3 px-4">Formulation / Regimen</th>
                <th className="py-3 px-4">Phase</th>
                <th className="py-3 px-4">CTRI Reg No</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-text-muted">
                    Loading clinical trials...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-text-muted">
                    No trials matched your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((tr) => (
                  <tr key={tr._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-primary font-mono">{tr.shortCode}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-text-main">{tr.condition}</div>
                      <div className="text-text-muted truncate max-w-md">{tr.title}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-text-main">{tr.formulation}</td>
                    <td className="py-3 px-4">{tr.phase}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-text-muted">
                      {tr.ctri?.number || <span className="italic">Pending CTRI</span>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={tr.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <NavLink
                        to={`/trials/${tr._id}`}
                        className="px-3 py-1 bg-white border border-border hover:bg-slate-50 text-primary font-bold rounded text-xs inline-block"
                      >
                        View
                      </NavLink>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register New Trial */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-[4px] border border-border shadow-lg max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-primary">Register New Ayurvedic Clinical Trial</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-text-muted hover:text-text-main text-lg font-bold">
                ✕
              </button>
            </div>

            {createError && (
              <div className="bg-red-50 text-status-danger p-3 rounded text-xs border border-red-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTrial} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-main">
                  Trial Title <span className="text-status-danger">* (required)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Clinical Evaluation of Yogaraja Guggulu..."
                  className="w-full h-9 px-3 border border-border rounded focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-main">
                    Short Code <span className="text-status-danger">* (required)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shortCode}
                    onChange={(e) => setFormData({ ...formData, shortCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. NT-KNEE-01"
                    className="w-full h-9 px-3 border border-border rounded font-mono uppercase focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-main">Trial Phase</label>
                  <select
                    value={formData.phase}
                    onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                    className="w-full h-9 px-2 border border-border rounded focus:outline-none"
                  >
                    <option value="Phase I">Phase I</option>
                    <option value="Phase II">Phase II</option>
                    <option value="Phase III">Phase III</option>
                    <option value="Phase IV">Phase IV</option>
                    <option value="Pilot / Exploratory">Pilot / Exploratory</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-main">
                    Condition / Disease <span className="text-status-danger">* (required)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    placeholder="e.g. Sandhivata (Osteoarthritis)"
                    className="w-full h-9 px-3 border border-border rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-main">
                    Classical Formulation <span className="text-status-danger">* (required)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.formulation}
                    onChange={(e) => setFormData({ ...formData, formulation: e.target.value })}
                    placeholder="e.g. Yogaraja Guggulu & Janu Basti"
                    className="w-full h-9 px-3 border border-border rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-main">Target Enrolment</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.targetEnrollment}
                    onChange={(e) => setFormData({ ...formData, targetEnrollment: e.target.value })}
                    className="w-full h-9 px-3 border border-border rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-main">Protocol Version</label>
                  <input
                    type="text"
                    value={formData.protocolVersion}
                    onChange={(e) => setFormData({ ...formData, protocolVersion: e.target.value })}
                    className="w-full h-9 px-3 border border-border rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-9 px-4 border border-border bg-white text-text-main rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded"
                >
                  Create Trial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
