import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, Loader2, SearchCheck, X } from 'lucide-react';
import type { AiEditorDiagram, AiReview } from '../../../../shared/ai/apiSchemas';
import { reviewAiFlowchart } from '../services/aiFlowchartClient';

interface AiReviewModalProps {
  isOpen: boolean;
  diagram: AiEditorDiagram;
  onClose: () => void;
}

const SEVERITY_STYLE: Record<AiReview['findings'][number]['severity'], string> = {
  critical: 'border-rose-200 bg-rose-50 text-rose-800',
  high: 'border-orange-200 bg-orange-50 text-orange-800',
  medium: 'border-amber-200 bg-amber-50 text-amber-800',
  low: 'border-slate-200 bg-slate-50 text-slate-700',
};

export function AiReviewModal({ isOpen, diagram, onClose }: AiReviewModalProps) {
  const titleId = useId();
  const abortRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState<AiReview | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setReview(null);
    setError('');
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    reviewAiFlowchart(diagram, controller.signal)
      .then((result) => setReview(result))
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : 'The flowchart could not be reviewed.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [isOpen, diagram]);

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) handleClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={handleClose} aria-label="Close AI review" className="absolute right-5 top-5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><X className="h-5 w-5" aria-hidden="true" /></button>
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><SearchCheck className="h-5 w-5" aria-hidden="true" /></div>
        <h2 id={titleId} className="pr-10 text-2xl font-bold tracking-tight text-slate-950">AI Flowchart Review</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Gemini checks the current diagram for missing branches, unclear labels, unreachable steps, and logic risks. Nothing on the canvas is changed.</p>

        {loading && <div role="status" aria-live="polite" className="mt-6 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-800"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Reviewing the diagram…</div>}
        {error && <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</div>}

        {review && (
          <div className="mt-6">
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{review.summary}</p>
            {review.findings.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No issues found.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {review.findings.map((finding) => (
                  <li key={`${finding.severity}:${finding.category}:${finding.message}`} className={`rounded-2xl border p-4 text-sm ${SEVERITY_STYLE[finding.severity]}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider">{finding.severity} · {finding.category}</span>
                    </div>
                    <p className="mt-2 font-medium">{finding.message}</p>
                    <p className="mt-1 opacity-90">{finding.recommendation}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-7 flex justify-end">
          <button type="button" onClick={handleClose} className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">Close</button>
        </div>
      </div>
    </div>
  );
}
