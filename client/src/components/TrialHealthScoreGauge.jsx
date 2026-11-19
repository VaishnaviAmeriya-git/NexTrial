import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function TrialHealthScoreGauge({ healthData }) {
  if (!healthData) {
    return (
      <div className="bg-white border border-border rounded-[4px] p-6 text-center text-text-muted">
        Health score data unavailable
      </div>
    );
  }

  const { score = 0, band = 'green', bandLabel = '', plainExplanation = '', breakdown = [] } = healthData;

  // Semicircle gauge calculation
  // Angle from -90 deg (left) to +90 deg (right)
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeColor = clampedScore >= 80 ? '#1E7B45' : (clampedScore >= 60 ? '#B26A00' : '#B3261E');
  const bgBandColor = clampedScore >= 80 ? 'bg-emerald-50 text-status-success' : (clampedScore >= 60 ? 'bg-amber-50 text-status-warning' : 'bg-red-50 text-status-danger');

  // SVG arc parameters
  const radius = 70;
  const circumference = Math.PI * radius; // Half-circle perimeter
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="bg-white border border-border rounded-[4px] p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-primary">Trial Health Score (THS)</h2>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${bgBandColor}`}>
              {bandLabel || (clampedScore >= 80 ? 'Healthy' : (clampedScore >= 60 ? 'Moderate Attention' : 'Critical Risk'))}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1 max-w-xl">
            {plainExplanation || 'Composite operational health indicator calculated from Enrollment, Retention, Compliance, Safety, and Data Quality.'}
          </p>
        </div>

        {/* Semi-circle Gauge SVG */}
        <div className="flex flex-col items-center justify-center flex-shrink-0">
          <div className="relative w-40 h-24 overflow-hidden flex items-end justify-center">
            <svg className="w-40 h-40 transform -rotate-180" viewBox="0 0 160 160">
              {/* Background Arc */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="14"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset="0"
              />
              {/* Value Arc */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={strokeColor}
                strokeWidth="14"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            {/* Center Score Readout */}
            <div className="absolute bottom-1 text-center">
              <span className="text-3xl font-extrabold text-text-main leading-none">
                {score}
              </span>
              <span className="text-xs text-text-muted font-medium"> / 100</span>
            </div>
          </div>
          <div className="text-[11px] text-text-muted mt-1 font-medium">
            Formula: 100 × (0.25E + 0.25R + 0.20C + 0.15S + 0.15Q)
          </div>
        </div>
      </div>

      {/* 5-Row Mathematical Breakdown Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Component Breakdown & Weighted Contribution
        </h3>

        <div className="overflow-x-auto border border-border rounded-[4px]">
          <table className="w-full text-left text-sm table-zebra">
            <thead className="bg-slate-100 border-b border-border text-xs uppercase text-text-muted font-semibold">
              <tr>
                <th className="py-2.5 px-3">Term</th>
                <th className="py-2.5 px-3">Component Metric</th>
                <th className="py-2.5 px-3 text-right">Value [0, 1]</th>
                <th className="py-2.5 px-3 text-right">Weight</th>
                <th className="py-2.5 px-3 text-right">Points</th>
                <th className="py-2.5 px-3">Operational Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {breakdown.map((row) => (
                <tr key={row.metric} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-primary">{row.metric}</td>
                  <td className="py-2.5 px-3 font-semibold text-text-main">{row.name}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">{row.value}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-text-muted">{row.weight}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                    +{row.points}
                  </td>
                  <td className="py-2.5 px-3 text-text-muted">{row.details}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-border font-bold text-xs text-text-main">
              <tr>
                <td colSpan="4" className="py-2.5 px-3 text-right">
                  Composite Trial Health Score (THS):
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-sm text-primary">
                  {score} / 100
                </td>
                <td className="py-2.5 px-3 text-text-muted">
                  {clampedScore >= 80 ? 'Target GCP Quality Met' : 'Action items detected in breakdown'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
