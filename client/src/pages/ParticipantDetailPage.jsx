import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Heart,
  Flame,
  ArrowRight
} from 'lucide-react';
import apiClient from '../api/client';
import PageFrame from '../components/PageFrame';
import StatusBadge from '../components/StatusBadge';
import RiskCard from '../components/RiskCard';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';

export default function ParticipantDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recomputingRisk, setRecomputingRisk] = useState(false);

  // Consent withdrawal modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('Personal reasons / unable to attend');

  // Visit completion modal
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [visitNotes, setVisitNotes] = useState('');
  const [agni, setAgni] = useState('Sama');

  const fetchParticipant = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/participants/${id}`);
      setData(res.data?.data);
    } catch (err) {
      console.error('Failed to load participant detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipant();
  }, [id]);

  const handleRecomputeRisk = async () => {
    setRecomputingRisk(true);
    try {
      const res = await apiClient.post(`/participants/${id}/risk`);
      if (res.data?.data) {
        setData(prev => ({
          ...prev,
          latestRisk: res.data.data,
        }));
      }
    } catch (e) {
      console.warn('Risk recomputation fallback — ML service may be unavailable:', e.message);
    } finally {
      setRecomputingRisk(false);
    }
  };

  const handleWithdrawConsent = async () => {
    try {
      await apiClient.post(`/participants/${id}/consent`, {
        action: 'withdraw',
        withdrawalReason: withdrawReason,
      });
      setShowWithdrawModal(false);
      fetchParticipant();
    } catch (err) {
      alert('Failed to withdraw consent');
    }
  };

  const handleUpdateVisit = async (visitId, status, extra = {}) => {
    try {
      await apiClient.patch(`/visits/${visitId}`, {
        status,
        actualDate: new Date(),
        ...extra,
      });
      setSelectedVisit(null);
      fetchParticipant();
    } catch (e) {
      alert('Failed to update visit status');
    }
  };

  if (loading && !data) {
    return (
      <PageFrame breadcrumbs={[{ label: 'Participants', to: '/participants' }, { label: 'Loading...' }]}>
        <div className="py-12 text-center text-text-muted">Loading participant profile...</div>
      </PageFrame>
    );
  }

  if (!data?.participant) {
    return (
      <PageFrame breadcrumbs={[{ label: 'Participants', to: '/participants' }, { label: 'Not Found' }]}>
        <div className="py-12 text-center text-status-danger">Participant record not found.</div>
      </PageFrame>
    );
  }

  const { participant, visits = [], consent, latestRisk, adverseEvents = [] } = data;

  return (
    <PageFrame
      breadcrumbs={[
        { label: 'Trials', to: '/trials' },
        { label: participant.trialId?.shortCode || 'Trial', to: `/trials/${participant.trialId?._id}` },
        { label: participant.subjectId },
      ]}
    >
      {/* Subject Header Card */}
      <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-mono text-primary bg-slate-100 px-3 py-1 rounded border">
              {participant.subjectId}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-primary">
                  {participant.age}y {participant.sex}
                </h1>
                <StatusBadge status={participant.status} />
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Trial: <strong>{participant.trialId?.title}</strong> ({participant.trialId?.shortCode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 border rounded text-text-main">
              Arm: {participant.arm}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-text-muted block">Travel Distance to Site:</span>
            <span className="font-semibold text-text-main font-mono">{participant.distanceKm} km</span>
          </div>
          <div>
            <span className="text-text-muted block">Enrolled Date:</span>
            <span className="font-semibold text-text-main font-mono">
              {participant.enrolledAt ? new Date(participant.enrolledAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-text-muted block">Consent Status:</span>
            <span className="font-semibold text-text-main">{participant.consentStatus}</span>
          </div>
          <div>
            <span className="text-text-muted block">Completed Visits:</span>
            <span className="font-semibold text-text-main font-mono">
              {visits.filter(v => v.status === 'Completed').length} / {visits.length}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Ayurveda Profile Card & Explainable ML Risk Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ayurveda Clinical Profile Card */}
        <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-saffron" />
              <h2 className="text-base font-bold text-primary">Ayurveda Clinical Profile</h2>
            </div>
            <span className="text-xs font-bold text-secondary uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Prakriti: {participant.ayurveda?.prakriti}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 border border-border rounded">
              <span className="text-text-muted block font-semibold">Dosha Imbalance:</span>
              <span className="font-bold text-text-main">
                {(participant.ayurveda?.doshaImbalance || []).join(', ') || 'Sama'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-border rounded">
              <span className="text-text-muted block font-semibold">Ayurvedic Diagnosis:</span>
              <span className="font-bold text-text-main">{participant.ayurveda?.ayurvedicDiagnosis}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-border rounded">
              <span className="text-text-muted block font-semibold">Classical Formulation:</span>
              <span className="font-bold text-primary">{participant.ayurveda?.formulation}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-border rounded">
              <span className="text-text-muted block font-semibold">Dosage & Anupana:</span>
              <span className="font-bold text-text-main">{participant.ayurveda?.dosage}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-border rounded text-xs space-y-1">
            <span className="font-semibold text-text-muted">Prescribed Panchakarma / Upakarma Procedure:</span>
            <p className="font-medium text-text-main">{participant.ayurveda?.procedure}</p>
          </div>
        </div>

        {/* Explainable ML Risk Card */}
        <RiskCard
          riskData={latestRisk}
          onRecompute={handleRecomputeRisk}
          isRecomputing={recomputingRisk}
        />
      </div>

      {/* Informed Consent Card */}
      <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-status-success" />
            <h2 className="text-base font-bold text-primary">Informed Consent Record</h2>
          </div>
          <StatusBadge status={participant.consentStatus === 'Signed' ? 'Completed' : 'Missed'} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-text-muted block">Consent Version:</span>
            <span className="font-bold text-text-main">v{consent?.version || '1.0'}</span>
          </div>
          <div>
            <span className="text-text-muted block">Execution Method:</span>
            <span className="font-bold text-text-main">{consent?.method || 'Written Paper'}</span>
          </div>
          <div>
            <span className="text-text-muted block">Signed On:</span>
            <span className="font-bold text-text-main font-mono">
              {consent?.signedAt ? new Date(consent.signedAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-text-muted block">Witness Name:</span>
            <span className="font-bold text-text-main">{consent?.witnessName || 'Nurse Staff'}</span>
          </div>
        </div>

        {participant.consentStatus === 'Signed' && ['admin', 'coordinator'].includes(user?.role) && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="text-xs font-semibold text-status-danger hover:underline"
            >
              Withdraw Informed Consent...
            </button>
          </div>
        )}
      </div>

      {/* Protocol Visits Tracking Table */}
      <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-base font-bold text-primary">Protocol Visit Calendar & Adherence</h2>
            <p className="text-xs text-text-muted">Scheduled visit windows and clinical assessments</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-border rounded-[4px]">
          <table className="w-full text-left text-xs table-zebra">
            <thead className="bg-slate-100 border-b border-border uppercase text-text-muted font-semibold">
              <tr>
                <th className="py-2.5 px-3">Visit</th>
                <th className="py-2.5 px-3">Milestone Name</th>
                <th className="py-2.5 px-3">Scheduled Date</th>
                <th className="py-2.5 px-3">Allowable Window</th>
                <th className="py-2.5 px-3">Actual Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visits.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold font-mono text-primary">Visit {v.visitNo}</td>
                  <td className="py-2.5 px-3 font-semibold text-text-main">{v.visitName || `Visit ${v.visitNo}`}</td>
                  <td className="py-2.5 px-3 font-mono">{new Date(v.scheduledDate).toLocaleDateString()}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-text-muted">
                    {new Date(v.windowStart).toLocaleDateString()} - {new Date(v.windowEnd).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium">
                    {v.actualDate ? new Date(v.actualDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {['admin', 'coordinator', 'investigator'].includes(user?.role) && v.status === 'Scheduled' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleUpdateVisit(v._id, 'Completed')}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px]"
                        >
                          ✔ Attend
                        </button>
                        <button
                          onClick={() => handleUpdateVisit(v._id, 'Missed')}
                          className="px-2 py-0.5 bg-white border border-red-300 text-status-danger hover:bg-red-50 rounded font-bold text-[11px]"
                        >
                          ✖ Missed
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Withdraw Consent Confirmation */}
      <ConfirmModal
        isOpen={showWithdrawModal}
        title="Withdraw Informed Consent?"
        message={`Are you sure you want to withdraw consent for participant ${participant.subjectId}? This will update the participant status to 'Withdrawn' and record this action in the immutable audit log.`}
        confirmText="Confirm Withdrawal"
        danger={true}
        onConfirm={handleWithdrawConsent}
        onCancel={() => setShowWithdrawModal(false)}
      />
    </PageFrame>
  );
}
