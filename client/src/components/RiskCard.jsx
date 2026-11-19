import React from 'react';
import { Brain, AlertCircle, ArrowUpRight, ArrowDownRight, CheckCircle, ShieldAlert } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function RiskCard({ riskData, onRecompute, isRecomputing }) {
  if (!riskData || riskData.predictionAvailable === false || riskData.band === 'Unavailable') {
    return (
      <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-text-muted" />
            <h3 className="text-base font-bold text-primary">Dropout Risk Assessment</h3>
          </div>
          <StatusBadge status="Prediction unavailable" />
        </div>
        <p className="text-sm text-text-muted">
          Machine learning inference service is currently offline or unreachable. Clinical workflows and data entry remain fully functional.
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-text-muted italic">
            Decision support only. Not a clinical decision.
          </span>
          {onRecompute && (
            <button
              onClick={onRecompute}
              disabled={isRecomputing}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {isRecomputing ? 'Checking service...' : 'Retry Inference'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const { probability, band = 'Low', topFactors = [], suggestedActions = [], modelVersion = 'v1.0-rf' } = riskData;
  const pct = probability !== null && probability !== undefined ? Math.round(probability * 100) : null;

  return (
    <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-secondary" />
          <h3 className="text-base font-bold text-primary">Dropout Risk Prediction</h3>
          <span className="text-[11px] text-text-muted font-mono bg-slate-100 px-1.5 py-0.5 rounded">
            {modelVersion}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {pct !== null && (
            <span className="text-xl font-extrabold text-primary font-mono">
              {pct}% <span className="text-xs font-normal text-text-muted">probability</span>
            </span>
          )}
          <StatusBadge status={`${band} risk`} />
        </div>
      </div>

      {/* Top 3 SHAP Drivers with Horizontal Progress Bars */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-wider">
          <span>Top SHAP Feature Attribution Drivers</span>
          <span>Direction & Impact</span>
        </div>

        {topFactors.length === 0 ? (
          <p className="text-xs text-text-muted italic">No SHAP attribution factors generated.</p>
        ) : (
          <div className="space-y-2.5">
            {topFactors.map((factor, idx) => {
              const isIncrease = factor.direction?.toLowerCase().includes('increase');
              const absVal = Math.min(1.0, Math.abs(factor.contribution || 0.1) * 3);
              const barWidth = Math.max(12, Math.round(absVal * 100));

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-main">
                      {factor.label || factor.feature} (value: {factor.value})
                    </span>
                    <span className={`flex items-center gap-1 font-medium text-[11px] ${isIncrease ? 'text-status-danger' : 'text-status-success'}`}>
                      {isIncrease ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {factor.direction}
                    </span>
                  </div>
                  {/* Visual Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-[2px] overflow-hidden">
                    <div
                      className={`h-full rounded-[2px] transition-all duration-300 ${isIncrease ? 'bg-status-danger' : 'bg-status-success'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggested Follow-up Actions */}
      {suggestedActions && suggestedActions.length > 0 && (
        <div className="bg-slate-50 border border-border rounded-[4px] p-3 space-y-2">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wide">
            <ShieldAlert className="w-4 h-4 text-secondary" />
            Recommended Clinical Coordinator Actions:
          </span>
          <ul className="text-xs text-text-main space-y-1 pl-4 list-disc marker:text-secondary">
            {suggestedActions.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer & Disclaimer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-border text-xs text-text-muted">
        <span className="italic font-medium">
          Decision support only. Not a clinical decision.
        </span>
        {onRecompute && (
          <button
            onClick={onRecompute}
            disabled={isRecomputing}
            className="text-primary hover:underline font-semibold"
          >
            {isRecomputing ? 'Recomputing SHAP...' : 'Re-run Prediction'}
          </button>
        )}
      </div>
    </div>
  );
}
