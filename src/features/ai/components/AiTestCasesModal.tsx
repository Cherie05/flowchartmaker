import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, ListChecks, Loader2, X } from 'lucide-react';
import type { AiEditorDiagram, AiTestCase } from '../../../../shared/ai/apiSchemas';
import { generateAiTestCases } from '../services/aiFlowchartClient';

interface AiTestCasesModalProps {
  isOpen: boolean;
  diagram: AiEditorDiagram;
  onClose: () => void;
}

export function AiTestCasesModal({ isOpen, diagram, onClose }: AiTestCasesModalProps) {
  const titleId = useId();
  const abortRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testCases, setTestCases] = useState<AiTestCase[] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTestCases(null);
    setError('');
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    generateAiTestCases(diagram, controller.signal)
      .then((result) => setTestCases(result))
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : 'Test cases could not be generated.');
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
        <button type="button" onClick={handleClose} aria-label="Close AI test cases" className="absolute right-5 top-5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><X className="h-5 w-5" aria-hidden="true" /></button>
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><ListChecks className="h-5 w-5" aria-hidden="true" /></div>
        <h2 id={titleId} className="pr-10 text-2xl font-bold tracking-tight text-slate-950">AI Test Cases</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Gemini generates practical test scenarios covering normal paths, rejected paths, and boundary decisions from the current diagram.</p>

        {loading && <div role="status" aria-live="polite" className="mt-6 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-800"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Generating test cases…</div>}
        {error && <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</div>}

        {testCases && (
          testCases.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No test cases were returned.</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {testCases.map((testCase, index) => (
                <li key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <p className="font-semibold text-slate-950">{testCase.title}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Inputs</p>
                  <p className="text-slate-700">{testCase.inputs.join(', ')}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Expected path</p>
                  <p className="text-slate-700">{testCase.expectedPath.join(' → ')}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Expected outcome</p>
                  <p className="text-slate-700">{testCase.expectedOutcome}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Risk covered</p>
                  <p className="text-slate-700">{testCase.riskCovered}</p>
                </li>
              ))}
            </ul>
          )
        )}

        <div className="mt-7 flex justify-end">
          <button type="button" onClick={handleClose} className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">Close</button>
        </div>
      </div>
    </div>
  );
}
