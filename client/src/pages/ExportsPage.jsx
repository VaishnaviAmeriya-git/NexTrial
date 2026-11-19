import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Layers,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import apiClient from '../api/client';
import PageFrame from '../components/PageFrame';

export default function ExportsPage() {
  const [trials, setTrials] = useState([]);
  const [selectedTrialId, setSelectedTrialId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrials = async () => {
      try {
        const res = await apiClient.get('/trials');
        const list = res.data?.data || [];
        setTrials(list);
        if (list.length > 0) setSelectedTrialId(list[0]._id);
      } catch (err) {
        console.error('Failed to load trials for export:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrials();
  }, []);

  const selectedTrial = trials.find(t => t._id === selectedTrialId);

  const downloadFHIR = async () => {
    if (!selectedTrialId) return;
    try {
      const res = await apiClient.get(`/trials/${selectedTrialId}/export/fhir`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nextrial-fhir-r4-${selectedTrial?.shortCode}.json`;
      a.click();
    } catch (e) {
      alert('FHIR export failed');
    }
  };

  const downloadCDISC = async (domain) => {
    if (!selectedTrialId) return;
    try {
      const res = await apiClient.get(`/trials/${selectedTrialId}/export/cdisc?domain=${domain}`);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTrial?.shortCode}_${domain}.csv`;
      a.click();
    } catch (e) {
      alert(`Export of ${domain} domain failed`);
    }
  };

  return (
    <PageFrame breadcrumbs={[{ label: 'Data Interoperability & Exports' }]}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Clinical Interoperability & Regulatory Exports</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            GCP-aligned FHIR R4 JSON bundles and CDISC SDTM-inspired tabular CSV archives.
          </p>
        </div>

        {trials.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-border rounded-[4px] p-1.5 shadow-sm">
            <span className="text-xs font-bold text-text-muted px-2">Trial:</span>
            <select
              value={selectedTrialId}
              onChange={(e) => setSelectedTrialId(e.target.value)}
              className="text-xs font-semibold text-primary bg-slate-50 border border-border rounded px-2.5 py-1 focus:outline-none"
            >
              {trials.map((tr) => (
                <option key={tr._id} value={tr._id}>
                  {tr.shortCode} - {tr.condition}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FHIR R4 Export */}
        <div className="bg-white border border-border rounded-[4px] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="p-2.5 rounded bg-blue-100 text-secondary">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary">FHIR R4 JSON Export (Prototype)</h2>
              <span className="text-xs text-text-muted">HL7 FHIR Release 4 standard compliant bundle</span>
            </div>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Constructs a valid HL7 FHIR R4 Collection Bundle containing:
          </p>
          <ul className="text-xs text-text-main list-disc pl-5 space-y-1">
            <li><code>ResearchStudy</code>: Protocol metadata, phase, and CTRI ID</li>
            <li><code>ResearchSubject</code>: Participant cohort assignments and study status</li>
            <li><code>Patient</code>: Pseudonymized demographics with Ayurvedic Prakriti extensions</li>
            <li><code>AdverseEvent</code>: Safety events mapped to suspect formulation</li>
            <li><code>Observation</code>: Visit attendance records and vital sign assessments</li>
          </ul>

          <div className="pt-2">
            <button
              onClick={downloadFHIR}
              disabled={!selectedTrialId}
              className="h-10 px-5 bg-primary hover:bg-primary-hover text-white rounded text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download FHIR R4 JSON Bundle</span>
            </button>
          </div>
        </div>

        {/* CDISC SDTM Export */}
        <div className="bg-white border border-border rounded-[4px] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="p-2.5 rounded bg-emerald-100 text-status-success">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary">CDISC SDTM-Inspired CSV Datasets</h2>
              <span className="text-xs text-text-muted">Tabular clinical research data submission domains</span>
            </div>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Structured standard regulatory submission datasets including our purpose-built Ayurvedic domain:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <button
              onClick={() => downloadCDISC('DM')}
              className="p-3 border border-border bg-slate-50 hover:bg-blue-50 text-left rounded text-text-main font-semibold flex items-center justify-between"
            >
              <div>
                <span className="text-primary block font-mono">DM.csv</span>
                <span className="text-[10px] text-text-muted font-normal">Demographics Domain</span>
              </div>
              <Download className="w-3.5 h-3.5 text-text-muted" />
            </button>

            <button
              onClick={() => downloadCDISC('AE')}
              className="p-3 border border-border bg-slate-50 hover:bg-blue-50 text-left rounded text-text-main font-semibold flex items-center justify-between"
            >
              <div>
                <span className="text-primary block font-mono">AE.csv</span>
                <span className="text-[10px] text-text-muted font-normal">Adverse Events Domain</span>
              </div>
              <Download className="w-3.5 h-3.5 text-text-muted" />
            </button>

            <button
              onClick={() => downloadCDISC('EX')}
              className="p-3 border border-border bg-slate-50 hover:bg-blue-50 text-left rounded text-text-main font-semibold flex items-center justify-between"
            >
              <div>
                <span className="text-primary block font-mono">EX.csv</span>
                <span className="text-[10px] text-text-muted font-normal">Exposure / Formulations</span>
              </div>
              <Download className="w-3.5 h-3.5 text-text-muted" />
            </button>

            <button
              onClick={() => downloadCDISC('AY')}
              className="p-3 border border-secondary/30 bg-blue-50 hover:bg-blue-100 text-left rounded text-text-main font-semibold flex items-center justify-between"
            >
              <div>
                <span className="text-secondary block font-mono">AY.csv</span>
                <span className="text-[10px] text-text-muted font-normal">Custom Ayurvedic Domain</span>
              </div>
              <Download className="w-3.5 h-3.5 text-secondary" />
            </button>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
