import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Loader2, Wand2, X } from 'lucide-react';
import type { AiDiagram } from '../../../../shared/ai/aiDiagramSchema';
import type { AiEditorDiagram } from '../../../../shared/ai/apiSchemas';
import { editAiFlowchart } from '../services/aiFlowchartClient';
import { AiDiagramPreview } from './AiDiagramPreview';

const MAX_INSTRUCTION_LENGTH = 2_000;

interface AiEditSelectionModalProps {
  isOpen: boolean;
  diagram: AiEditorDiagram;
  selectedNodeIds: string[];
  onClose: () => void;
  onAccept: (fragment: AiDiagram) => void;
}

export function AiEditSelectionModal({ isOpen, diagram, selectedNodeIds, onClose, onAccept }: AiEditSelectionModalProps) {
  const titleId = useId();
  const instructionId = useId();
  const instructionRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [instruction, setInstruction] = useState('');
  const [fragment, setFragment] = useState<AiDiagram | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setInstruction('');
      setFragment(null);
      setError('');
      abortRef.current?.abort();
      return;
    }
    const frame = window.requestAnimationFrame(() => instructionRef.current?.focus());
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
    };
  }, [isOpen]);

  const handleGenerate = async () => {
    const normalized = instruction.trim();
    if (!normalized || normalized.length > MAX_INSTRUCTION_LENGTH || loading || selectedNodeIds.length === 0) return;
    setFragment(null);
    setError('');
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setFragment(await editAiFlowchart({
        instruction: normalized,
        mode: 'selected-area',
        diagram,
        selectedNodeIds,
        selectedConnectionIds: [],
      }, controller.signal));
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) {
        setError(requestError instanceof Error ? requestError.message : 'The selection could not be edited.');
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
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={handleClose} aria-label="Close AI selection editor" className="absolute right-5 top-5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><X className="h-5 w-5" aria-hidden="true" /></button>
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Wand2 className="h-5 w-5" aria-hidden="true" /></div>
        <h2 id={titleId} className="pr-10 text-2xl font-bold tracking-tight text-slate-950">Edit Selection with AI</h2>

        {!fragment && (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-600">Describe how the {selectedNodeIds.length} selected step{selectedNodeIds.length === 1 ? '' : 's'} should change. Gemini returns a replacement you can preview before it touches the canvas.</p>
            <label htmlFor={instructionId} className="mt-6 block text-sm font-semibold text-slate-800">Instruction</label>
            <textarea ref={instructionRef} id={instructionId} value={instruction} maxLength={MAX_INSTRUCTION_LENGTH} disabled={loading} onChange={(event) => setInstruction(event.target.value)} rows={5} placeholder="e.g. Split this into a manager approval step and a finance step…" className="mt-2 w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50" />
            <div className="mt-1 flex items-center justify-between gap-3 text-xs text-slate-500"><span>Only the selected area is sent to Gemini for editing.</span><span aria-label={`${instruction.length} of ${MAX_INSTRUCTION_LENGTH} characters`}>{instruction.length}/{MAX_INSTRUCTION_LENGTH}</span></div>

            {loading && <div role="status" aria-live="polite" className="mt-5 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-800"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Revising the selected area…</div>}
            {error && <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</div>}

            <p className="mt-5 text-xs text-slate-500">Shares the same daily AI limit as flowchart generation. Manual editing always remains available.</p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={handleClose} className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">{loading ? 'Cancel request' : 'Cancel'}</button>
              <button type="button" onClick={() => void handleGenerate()} disabled={loading || !instruction.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"><Wand2 className="h-4 w-4" aria-hidden="true" />Generate Edit</button>
            </div>
          </>
        )}

        {fragment && (
          <div className="mt-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Preview</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-950">{fragment.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{fragment.summary}</p>
                </div>
                <div className="shrink-0 rounded-xl bg-white px-3 py-2 text-right text-xs text-slate-600 shadow-sm"><strong className="block text-base text-slate-950">{fragment.nodes.length}</strong>nodes<br /><strong className="mt-1 block text-base text-slate-950">{fragment.edges.length}</strong>connections</div>
              </div>
              <AiDiagramPreview diagram={fragment} />
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={handleClose} className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
              <button type="button" onClick={() => { setFragment(null); window.requestAnimationFrame(() => instructionRef.current?.focus()); }} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="mr-1 inline h-4 w-4" aria-hidden="true" />Generate Again</button>
              <button type="button" onClick={() => onAccept(fragment)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white hover:bg-violet-800"><Check className="h-4 w-4" aria-hidden="true" />Apply to Selection</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
