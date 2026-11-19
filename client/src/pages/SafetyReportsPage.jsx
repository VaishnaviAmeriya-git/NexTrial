import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  Tag,
  ArrowRight
} from 'lucide-react';
import apiClient from '../api/client';
import PageFrame from '../components/PageFrame';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function SafetyReportsPage() {
  const { user } = useAuth();
  const [adverseEvents, setAdverseEvents] = useState([]);
  const [trials, setTrials] = useState([]);
  const [selectedTrial, setSelectedTrial] = useState('');
  const [seriousOnly, setSeriousOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Coding modal for PV officer
  const [selectedAEForCoding, setSelectedAEForCoding] = useState(null);
  const [meddraQuery, setMeddraQuery] = useState('');
  const [meddraResults, setMeddraResults] = useState([]);
  const [codingForm, setCodingForm] = useState({ soc: '', pt: '', code: '' });

  const fetchSafetyData = async () => {
    setLoading(true);
    try {
      const trRes = await apiClient.get('/trials');
      const trialList = trRes.data?.data || [];
      setTrials(trialList);

      const allAEs = [];
      for (const tr of trialList) {
        const res = await apiClient.get(`/trials/${tr._id}/adverse-events`);
        if (res.data?.data) {
          allAEs.push(...res.data.data.map(a => ({ ...a, trialShortCode: tr.shortCode })));
        }
      }
      setAdverseEvents(allAEs);
    } catch (err) {
      console.error('Failed to load safety reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafetyData();
  }, []);

  const searchMeddra = async (q) => {
    setMeddraQuery(q);
    if (!q || q.length < 2) {
      setMeddraResults([]);
      return;
    }
    try {
      const res = await apiClient.get(`/dictionary/meddra?q=${encodeURIComponent(q)}`);
      setMeddraResults(res.data?.data || []);
    } catch (e) {}
  };

  const handleApplyCoding = async (e) => {
    e.preventDefault();
    if (!selectedAEForCoding) return;
    try {
      await apiClient.post(`/adverse-events/${selectedAEForCoding._id}/code`, codingForm);
      setSelectedAEForCoding(null);
      fetchSafetyData();
    } catch (err) {
      alert('Failed to code adverse event');
    }
  };

  const filtered = adverseEvents.filter((ae) => {
    if (selectedTrial && ae.trialId !== selectedTrial && ae.trialId?._id !== selectedTrial) return false;
    if (seriousOnly && !ae.serious) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (ae.verbatimTerm || '').toLowerCase().includes(q) ||
        (ae.coded?.pt || '').toLowerCase().includes(q) ||
        (ae.participantId?.subjectId || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalAEs = adverseEvents.length;
  const seriousAEs = adverseEvents.filter(a => a.serious).length;
  const pendingIecNotice = adverseEvents.filter(a => a.serious && !a.reportedTo?.iec).length;

  return (
    <PageFrame breadcrumbs={[{ label: 'Safety & Pharmacovigilance' }]}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-status-danger" />
            <h1 className="text-2xl font-bold text-primary">Safety Reports & Pharmacovigilance</h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Adverse Event reporting, WHO-UMC causality assessments, MedDRA demo coding, and mandatory 24-hour SAE regulatory clocks.
          </p>
        </div>
      </div>

      {/* Safety Summary KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-[4px] p-4 shadow-sm">
          <span className="text-xs font-bold uppercase text-text-muted">Total Adverse Events</span>
          <div className="text-2xl font-extrabold text-primary mt-1 font-mono">{totalAEs}</div>
          <p className="text-xs text-text-muted mt-0.5">Reported across all active trials</p>
        </div>

        <div className="bg-white border border-border rounded-[4px] p-4 shadow-sm">
          <span className="text-xs font-bold uppercase text-text-muted">Serious Adverse Events (SAE)</span>
          <div className="text-2xl font-extrabold text-status-danger mt-1 font-mono">{seriousAEs}</div>
          <p className="text-xs text-text-muted mt-0.5">Hospitalization or medically important events</p>
        </div>

        <div className="bg-white border border-border rounded-[4px] p-4 shadow-sm">
          <span className="text-xs font-bold uppercase text-text-muted">24-Hour SAE Clocks Pending</span>
          <div className="text-2xl font-extrabold text-status-warning mt-1 font-mono">{pendingIecNotice}</div>
          <p className="text-xs text-text-muted mt-0.5">Awaiting confirmed IEC notification</p>
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
            placeholder="Search by verbatim term, MedDRA PT..."
            className="w-full h-10 pl-9 pr-3 text-xs border border-border rounded-[4px] focus:outline-none focus:border-secondary"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-xs font-bold text-status-danger cursor-pointer bg-red-50 px-3 py-2 border border-red-200 rounded">
            <input
              type="checkbox"
              checked={seriousOnly}
              onChange={(e) => setSeriousOnly(e.target.checked)}
              className="rounded text-status-danger focus:ring-status-danger"
            />
            <span>Show Serious AEs Only</span>
          </label>

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
        </div>
      </div>

      {/* Safety Table */}
      <div className="bg-white border border-border rounded-[4px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-zebra">
            <thead className="bg-slate-100 border-b border-border uppercase text-text-muted font-semibold">
              <tr>
                <th className="py-3 px-3">Subject ID</th>
                <th className="py-3 px-3">Trial</th>
                <th className="py-3 px-3">Verbatim AE Term</th>
                <th className="py-3 px-3">MedDRA PT / SOC</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">WHO Causality</th>
                <th className="py-3 px-3">SAE 24h Clock</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-text-muted">
                    Loading adverse events...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-text-muted">
                    No adverse events found.
                  </td>
                </tr>
              ) : (
                filtered.map((ae) => {
                  let clockRemaining = null;
                  if (ae.serious && ae.deadlines?.initialDue) {
                    const msLeft = new Date(ae.deadlines.initialDue) - new Date();
                    const hoursLeft = Math.round(msLeft / (1000 * 60 * 60));
                    clockRemaining = hoursLeft > 0 ? `${hoursLeft}h remaining` : 'EXPIRED / OVERDUE';
                  }

                  return (
                    <tr
                      key={ae._id}
                      className={ae.serious ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3 px-3 font-bold font-mono text-primary">
                        {ae.participantId?.subjectId || 'N/A'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-text-muted">
                        {ae.trialShortCode}
                      </td>
                      <td className="py-3 px-3 font-semibold text-text-main max-w-xs">
                        {ae.verbatimTerm}
                      </td>
                      <td className="py-3 px-3 text-text-muted">
                        <div className="font-semibold text-text-main">{ae.coded?.pt || 'Uncoded'}</div>
                        <div className="text-[10px] text-text-muted/80">{ae.coded?.soc}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            ae.severity === 'Severe'
                              ? 'bg-red-100 text-status-danger'
                              : ae.severity === 'Moderate'
                              ? 'bg-amber-100 text-status-warning'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ae.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium">{ae.causality}</td>
                      <td className="py-3 px-3">
                        {ae.serious ? (
                          <div className="font-mono text-[11px]">
                            {ae.reportedTo?.iec ? (
                              <span className="text-status-success font-bold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Reported</span>
                              </span>
                            ) : (
                              <span className="text-status-danger font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 animate-pulse" />
                                <span>{clockRemaining}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted">Non-serious</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={ae.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        {['admin', 'pv_officer'].includes(user?.role) && (
                          <button
                            onClick={() => {
                              setSelectedAEForCoding(ae);
                              setCodingForm({
                                soc: ae.coded?.soc || '',
                                pt: ae.coded?.pt || '',
                                code: ae.coded?.code || '',
                              });
                            }}
                            className="px-2 py-0.5 bg-white border border-border hover:bg-slate-100 text-primary font-bold rounded text-[11px] inline-flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3" />
                            <span>Code</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: MedDRA Coding */}
      {selectedAEForCoding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-[4px] border border-border shadow-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-primary">Assign MedDRA / Ayurvedic Coding</h2>
              <button onClick={() => setSelectedAEForCoding(null)} className="text-text-muted font-bold">✕</button>
            </div>

            <div className="p-2.5 bg-slate-50 border rounded text-xs space-y-1">
              <span className="text-text-muted">Verbatim Reported Term:</span>
              <div className="font-bold text-text-main">{selectedAEForCoding.verbatimTerm}</div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-text-main">Search Demo MedDRA Dictionary</label>
              <input
                type="text"
                value={meddraQuery}
                onChange={(e) => searchMeddra(e.target.value)}
                placeholder="Type preferred term (e.g. gastric, nausea, headache)..."
                className="w-full h-9 px-3 border border-border rounded focus:outline-none"
              />
            </div>

            {meddraResults.length > 0 && (
              <div className="border border-border rounded max-h-36 overflow-y-auto divide-y divide-border text-xs">
                {meddraResults.map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCodingForm({ soc: m.soc, pt: m.pt, code: m.code });
                      setMeddraResults([]);
                    }}
                    className="w-full text-left p-2 hover:bg-blue-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-primary">{m.pt}</span>
                      <span className="text-text-muted text-[10px] block">{m.soc}</span>
                    </div>
                    <span className="font-mono text-[10px] text-text-muted">{m.code}</span>
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleApplyCoding} className="space-y-3 text-xs pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-main">System Organ Class (SOC)</label>
                  <input
                    type="text"
                    required
                    value={codingForm.soc}
                    onChange={(e) => setCodingForm({ ...codingForm, soc: e.target.value })}
                    className="w-full h-8 px-2 border rounded"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-main">Preferred Term (PT)</label>
                  <input
                    type="text"
                    required
                    value={codingForm.pt}
                    onChange={(e) => setCodingForm({ ...codingForm, pt: e.target.value })}
                    className="w-full h-8 px-2 border rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedAEForCoding(null)}
                  className="h-8 px-3 border rounded text-text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 bg-primary text-white font-semibold rounded"
                >
                  Save Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
