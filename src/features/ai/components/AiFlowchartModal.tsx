import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Loader2, Sparkles, X } from 'lucide-react';
import type { AiDiagram } from '../../../../shared/ai/aiDiagramSchema';
import { generateAiFlowchart, getAiAvailability, type AiAvailability } from '../services/aiFlowchartClient';
import { AiDiagramPreview } from './AiDiagramPreview';

const MAX_PROMPT_LENGTH = 2_000;
const EXAMPLES = [
  'Create an employee leave approval workflow. The employee submits a request, the manager reviews it, and HR checks the leave balance. Include approval and rejection outcomes.',
  'Create an online refund process. Support checks eligibility. Refunds above ₹5,000 require manager approval. Finance processes approved refunds and the customer is notified of every result.',
  'Create a user registration workflow. Validate the entered details, create the account when valid, send verification, and show errors when invalid.',
];
const LOADING_MESSAGES = [
  'Understanding your workflow…',
  'Creating steps and decisions…',
  'Arranging the flowchart…',
];

interface AiFlowchartModalProps {
  isOpen: boolean;
  hasExistingContent: boolean;
  onClose: () => void;
  onAccept: (diagram: AiDiagram, mode: 'replace' | 'add') => void;
}

export function AiFlowchartModal({ isOpen, hasExistingContent, onClose, onAccept }: AiFlowchartModalProps) {
  const titleId = useId();
  const promptId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [prompt, setPrompt] = useState('');
  const [diagram, setDiagram] = useState<AiDiagram | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [placementStep, setPlacementStep] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [availability, setAvailability] = useState<AiAvailability | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    void getAiAvailability().then((result) => {
      if (active) setAvailability(result);
    });
    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => promptRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      abortRef.current?.abort();
      onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      abortRef.current?.abort();
      abortRef.current = null;
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const timer = window.setInterval(() => {
      setLoadingStep((current) => Math.min(current + 1, LOADING_MESSAGES.length - 1));
    }, 2_200);
    return () => window.clearInterval(timer);
  }, [loading]);

  const resetResult = () => {
    setDiagram(null);
    setError('');
    setPlacementStep(false);
    setConfirmReplace(false);
  };

  const handleGenerate = async () => {
    const normalizedPrompt = prompt.trim();
    if (!normalizedPrompt || normalizedPrompt.length > MAX_PROMPT_LENGTH || loading || !availability?.configured) return;
    resetResult();
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setDiagram(await generateAiFlowchart(normalizedPrompt, undefined, controller.signal));
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) {
        setError(requestError instanceof Error ? requestError.message : 'The flowchart could not be generated.');
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  };

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) handleClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={handleClose} aria-label="Close AI flowchart generator" className="absolute right-5 top-5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><X className="h-5 w-5" aria-hidden="true" /></button>
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Sparkles className="h-5 w-5" aria-hidden="true" /></div>
        <h2 id={titleId} className="pr-10 text-2xl font-bold tracking-tight text-slate-950">Generate Flowchart with AI</h2>

        {!diagram && !placementStep && (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-600">Describe a process and Gemini will create a validated, editable flowchart for you to review.</p>
            {availability === null && <p role="status" className="mt-4 text-sm text-slate-500">Checking AI availability…</p>}
            {availability && !availability.configured && (
              <div role="status" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {import.meta.env.DEV
                  ? availability.reason === 'not-configured'
                    ? 'AI generation is not configured. Add GEMINI_API_KEY to the root .env file and restart the development server.'
                    : 'The AI server is unavailable. Start Wizzleflow with npm run dev and try again.'
                  : 'AI generation is currently unavailable.'}
              </div>
            )}
            {availability?.configured && (
              <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Free limit: 3 generations per day, with a 20-second wait between attempts. Manual editing always remains available.
              </p>
            )}
            <label htmlFor={promptId} className="mt-6 block text-sm font-semibold text-slate-800">Process description</label>
            <textarea ref={promptRef} id={promptId} value={prompt} maxLength={MAX_PROMPT_LENGTH} disabled={loading} onChange={(event) => setPrompt(event.target.value)} rows={7} placeholder="Describe the steps, decisions, and possible outcomes…" className="mt-2 w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50" />
            <div className="mt-1 flex items-center justify-between gap-3 text-xs text-slate-500"><span>Process descriptions are sent to Gemini only when you click Generate.</span><span aria-label={`${prompt.length} of ${MAX_PROMPT_LENGTH} characters`}>{prompt.length}/{MAX_PROMPT_LENGTH}</span></div>

            {!loading && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Example prompts</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {EXAMPLES.map((example, index) => <button key={example} type="button" onClick={() => setPrompt(example)} className="rounded-xl border border-slate-200 p-3 text-left text-xs leading-5 text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Example {index + 1}: {example.slice(0, 58)}…</button>)}
                </div>
              </div>
            )}

            {loading && <div role="status" aria-live="polite" className="mt-5 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-800"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />{LOADING_MESSAGES[loadingStep]}</div>}
            {error && <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</div>}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={handleClose} className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">{loading ? 'Cancel request' : 'Cancel'}</button>
              <button type="button" onClick={() => void handleGenerate()} disabled={loading || !prompt.trim() || !availability?.configured} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"><Sparkles className="h-4 w-4" aria-hidden="true" />Generate</button>
            </div>
          </>
        )}

        {diagram && !placementStep && (
          <Preview diagram={diagram} onBack={() => { resetResult(); window.requestAnimationFrame(() => promptRef.current?.focus()); }} onClose={handleClose} onUse={() => { if (hasExistingContent) setPlacementStep(true); else onAccept(diagram, 'replace'); }} />
        )}

        {diagram && placementStep && (
          <div className="mt-6">
            <button type="button" onClick={() => { setPlacementStep(false); setConfirmReplace(false); }} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to preview</button>
            <h3 className="mt-5 text-lg font-bold text-slate-950">How should this generated flowchart be added?</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => onAccept(diagram, 'add')} className="rounded-2xl border border-violet-300 bg-violet-50 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><span className="block font-semibold text-violet-900">Add to current diagram</span><span className="mt-1 block text-sm text-violet-700">Place it beside the existing content.</span></button>
              <button type="button" onClick={() => setConfirmReplace(true)} className="rounded-2xl border border-slate-300 p-4 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><span className="block font-semibold text-slate-900">Replace current diagram</span><span className="mt-1 block text-sm text-slate-600">Remove current nodes after confirmation.</span></button>
            </div>
            {confirmReplace && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="font-semibold text-rose-900">Replace all current canvas content?</p><p className="mt-1 text-sm text-rose-700">You can undo this as one action after accepting.</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => setConfirmReplace(false)} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700">Keep current content</button><button type="button" onClick={() => onAccept(diagram, 'replace')} className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white">Confirm replacement</button></div></div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Preview({ diagram, onBack, onClose, onUse }: { diagram: AiDiagram; onBack: () => void; onClose: () => void; onUse: () => void }) {
  return <div className="mt-6"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Preview</p><h3 className="mt-1 text-xl font-bold text-slate-950">{diagram.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{diagram.summary}</p></div><div className="shrink-0 rounded-xl bg-white px-3 py-2 text-right text-xs text-slate-600 shadow-sm"><strong className="block text-base text-slate-950">{diagram.nodes.length}</strong>nodes<br /><strong className="mt-1 block text-base text-slate-950">{diagram.edges.length}</strong>connections</div></div><AiDiagramPreview diagram={diagram} /></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200">Cancel</button><button type="button" onClick={onBack} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Generate Again</button><button type="button" onClick={onUse} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white hover:bg-violet-800"><Check className="h-4 w-4" aria-hidden="true" />Use This Flowchart</button></div></div>;
}

