import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  XCircle,
  Activity,
  ArrowUp,
  ArrowDown,
  Circle,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function StatusBadge({ status, type = 'general', size = 'sm' }) {
  if (!status) return null;

  const s = String(status).trim();
  const lower = s.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
  let icon = <Circle className="w-3 h-3 flex-shrink-0" />;

  // 1. Risk Bands
  if (lower === 'high' || lower === 'high risk') {
    colorClasses = 'bg-red-50 text-status-danger border-red-300 font-bold';
    icon = <span className="font-bold text-status-danger">▲</span>;
  } else if (lower === 'medium' || lower === 'medium risk') {
    colorClasses = 'bg-amber-50 text-status-warning border-amber-300 font-bold';
    icon = <span className="font-bold text-status-warning">●</span>;
  } else if (lower === 'low' || lower === 'low risk') {
    colorClasses = 'bg-emerald-50 text-status-success border-emerald-300 font-bold';
    icon = <span className="font-bold text-status-success">▼</span>;
  }

  // 2. Clinical / Visit Statuses
  else if (lower === 'completed') {
    colorClasses = 'bg-emerald-50 text-status-success border-emerald-300';
    icon = <span className="font-bold">✔</span>;
  } else if (lower === 'missed') {
    colorClasses = 'bg-red-50 text-status-danger border-red-300';
    icon = <span className="font-bold">✖</span>;
  } else if (lower === 'out-of-window') {
    colorClasses = 'bg-amber-50 text-status-warning border-amber-300';
    icon = <span className="font-bold">⚠</span>;
  } else if (lower === 'scheduled' || lower === 'active') {
    colorClasses = 'bg-blue-50 text-secondary border-blue-200';
    icon = <CheckCircle className="w-3 h-3 flex-shrink-0 text-secondary" />;
  } else if (lower === 'enrolled') {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    icon = <ShieldCheck className="w-3 h-3 flex-shrink-0 text-indigo-700" />;
  } else if (lower === 'withdrawn' || lower === 'lost to follow-up') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    icon = <XCircle className="w-3 h-3 flex-shrink-0 text-rose-700" />;
  } else if (lower === 'screened') {
    colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
    icon = <FileText className="w-3 h-3 flex-shrink-0" />;
  }

  // 3. Regulatory / SAE Statuses
  else if (lower === 'serious' || lower === 'sae') {
    colorClasses = 'bg-red-100 text-status-danger border-red-300 font-bold animate-pulse';
    icon = <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />;
  } else if (lower === 'open' || lower === 'unreported') {
    colorClasses = 'bg-amber-50 text-status-warning border-amber-300';
    icon = <Clock className="w-3 h-3 flex-shrink-0" />;
  } else if (lower === 'reported' || lower === 'resolved' || lower === 'closed') {
    colorClasses = 'bg-emerald-50 text-status-success border-emerald-300';
    icon = <CheckCircle className="w-3 h-3 flex-shrink-0" />;
  } else if (lower === 'prediction unavailable') {
    colorClasses = 'bg-slate-100 text-slate-600 border-slate-300 italic';
    icon = <AlertCircle className="w-3 h-3 flex-shrink-0" />;
  }

  const sizeClasses = size === 'xs' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-[4px] font-medium leading-none ${colorClasses} ${sizeClasses}`}
      role="status"
    >
      {icon}
      <span>{s}</span>
    </span>
  );
}
