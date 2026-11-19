import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  Filter,
  Check
} from 'lucide-react';
import apiClient from '../api/client';
import PageFrame from '../components/PageFrame';
import StatusBadge from '../components/StatusBadge';

export default function AlertsCenterPage() {
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('open');
  const [severityFilter, setSeverityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let url = `/alerts?status=${statusFilter}`;
      const res = await apiClient.get(url);
      setAlerts(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const handleAck = async (alertId) => {
    try {
      await apiClient.patch(`/alerts/${alertId}/ack`);
      fetchAlerts();
    } catch (err) {
      alert('Failed to acknowledge alert');
    }
  };

  const filtered = alerts.filter((a) => {
    if (severityFilter && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <PageFrame breadcrumbs={[{ label: 'Alerts Centre' }]}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-status-warning" />
            <h1 className="text-2xl font-bold text-primary">Regulatory & Protocol Alerts Centre</h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Real-time compliance monitoring: 24h SAE deadlines, 30-day IEC expiry warnings, and overdue visit tracking.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-border rounded-[4px] p-3 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${
              statusFilter === 'open' ? 'bg-primary text-white' : 'bg-slate-100 text-text-main hover:bg-slate-200'
            }`}
          >
            Open Alerts ({alerts.filter(a => a.status === 'open').length})
          </button>
          <button
            onClick={() => setStatusFilter('ack')}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${
              statusFilter === 'ack' ? 'bg-primary text-white' : 'bg-slate-100 text-text-main hover:bg-slate-200'
            }`}
          >
            Acknowledged History
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-9 px-3 text-xs border border-border rounded-[4px] bg-slate-50 focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="danger">Critical Danger (SAE Clocks)</option>
            <option value="warning">Warning</option>
            <option value="info">Informational</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-8 text-center text-xs text-text-muted border rounded">
            Loading alerts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-8 text-center text-xs text-text-muted border rounded">
            No alerts found under selected filter.
          </div>
        ) : (
          filtered.map((alt) => {
            const isDanger = alt.severity === 'danger';
            return (
              <div
                key={alt._id}
                className={`p-4 rounded-[4px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                  isDanger
                    ? 'bg-red-50/50 border-red-300'
                    : 'bg-amber-50/40 border-amber-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded mt-0.5 ${isDanger ? 'bg-red-100 text-status-danger' : 'bg-amber-100 text-status-warning'}`}>
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-primary">
                        {alt.type.replace(/_/g, ' ')}
                      </span>
                      {alt.trialId && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white border rounded text-secondary font-mono">
                          {alt.trialId.shortCode}
                        </span>
                      )}
                      {alt.participantId && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white border rounded text-text-main font-mono">
                          {alt.participantId.subjectId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-main font-medium leading-relaxed">
                      {alt.message}
                    </p>
                    <div className="text-[10px] text-text-muted font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(alt.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {alt.status === 'open' ? (
                    <button
                      onClick={() => handleAck(alt._id)}
                      className="px-3 py-1.5 bg-white border border-border hover:bg-slate-50 text-primary font-bold rounded text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-status-success font-bold flex items-center gap-1 bg-white px-2 py-1 border rounded">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Acknowledged</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </PageFrame>
  );
}
