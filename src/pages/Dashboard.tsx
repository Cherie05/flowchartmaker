import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock3, Copy, Download, FileText, LayoutTemplate, Loader, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { Logo } from '../components/Logo';
import { Toast, type ToastTone } from '../components/Toast';
import { getStarterDiagramDraft, starterTemplates, type StarterTemplateId } from '../features/dashboard/diagramTemplates';
import { getErrorMessage } from '../lib/errors';
import { flowchartService } from '../services/flowchartService';
import type { FlowChartRecord } from '../types/flowChart';

interface ToastState { message: string; tone: ToastTone }

export function Dashboard() {
  const navigate = useNavigate();
  const [flowcharts, setFlowcharts] = useState<FlowChartRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadFlowcharts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setFlowcharts(await flowchartService.getAllFlowcharts());
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Unable to read diagrams from this browser.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadFlowcharts(); }, [loadFlowcharts]);

  const visibleFlowcharts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? flowcharts.filter((flowchart) => flowchart.name.toLowerCase().includes(normalized)) : flowcharts;
  }, [flowcharts, query]);

  const createDiagram = async (templateId: StarterTemplateId = 'blank') => {
    try {
      setError('');
      const diagram = await flowchartService.createFlowchart(getStarterDiagramDraft(templateId));
      navigate(`/editor/${diagram.id}`);
    } catch (createError) {
      setError(getErrorMessage(createError, 'Unable to create a diagram in local storage.'));
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await flowchartService.deleteFlowchart(deletingId);
      setFlowcharts((current) => current.filter((flowchart) => flowchart.id !== deletingId));
      notify('Diagram deleted from this browser.', 'success');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Unable to delete this diagram.'));
    } finally {
      setDeletingId(null);
    }
  };

  const duplicateDiagram = async (id: string) => {
    try {
      const duplicate = await flowchartService.duplicateFlowchart(id);
      setFlowcharts((current) => [duplicate, ...current]);
      notify('Diagram duplicated.', 'success');
    } catch (duplicateError) {
      setError(getErrorMessage(duplicateError, 'Unable to duplicate this diagram.'));
    }
  };

  const startRename = (flowchart: FlowChartRecord) => {
    setRenamingId(flowchart.id);
    setRenameValue(flowchart.name);
  };

  const commitRename = async () => {
    if (!renamingId) return;
    const nextName = renameValue.trim() || 'Untitled Diagram';
    try {
      const updated = await flowchartService.updateFlowchart(renamingId, { name: nextName });
      setFlowcharts((current) => current.map((flowchart) => flowchart.id === updated.id ? updated : flowchart));
      notify('Diagram renamed.', 'success');
    } catch (renameError) {
      setError(getErrorMessage(renameError, 'Unable to rename this diagram.'));
    } finally {
      setRenamingId(null);
    }
  };

  const exportDiagram = (flowchart: FlowChartRecord) => {
    const payload = JSON.stringify({ name: flowchart.name, nodes: flowchart.nodes, connections: flowchart.connections }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFilename(flowchart.name)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify('JSON backup exported.', 'success');
  };

  return (
    <div className="min-h-screen bg-[var(--wf-bg)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate('/')} aria-label="Go to Wizzleflow home" className="rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200">
            <Logo />
          </button>
          <button type="button" onClick={() => void createDiagram()} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300 sm:px-5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Diagram
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">Local workspace</p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your diagrams</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Create, reopen, and back up diagrams saved in this browser.</p>
          </div>
          {flowcharts.length > 0 && (
            <label className="relative block w-full max-w-sm">
              <span className="sr-only">Search diagrams</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search diagrams" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
            </label>
          )}
        </section>

        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900" role="note">
          <Download className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p><strong>Your diagrams are saved in this browser.</strong> Export important diagrams for backup; clearing browser storage can remove them.</p>
        </div>

        {error && <div role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center" role="status" aria-live="polite">
            <Loader className="h-7 w-7 animate-spin text-violet-600" aria-hidden="true" />
            <span className="sr-only">Loading local diagrams</span>
          </div>
        ) : flowcharts.length === 0 ? (
          <EmptyDashboard onCreate={createDiagram} />
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-slate-500">{visibleFlowcharts.length} {visibleFlowcharts.length === 1 ? 'diagram' : 'diagrams'}</p>
            </div>
            {visibleFlowcharts.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleFlowcharts.map((flowchart) => (
                  <article key={flowchart.id} className="group flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-[var(--wf-shadow-sm)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[var(--wf-shadow-md)]">
                    <div className="mb-5 flex h-24 items-center justify-center rounded-2xl border border-slate-100 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.28)_1px,transparent_0)] [background-size:18px_18px]">
                      <div className="flex items-center gap-2 text-violet-700">
                        <LayoutTemplate className="h-7 w-7" aria-hidden="true" />
                        <span className="text-xs font-semibold">{flowchart.nodes.length} nodes</span>
                      </div>
                    </div>

                    {renamingId === flowchart.id ? (
                      <label className="mb-2 block">
                        <span className="sr-only">Diagram name</span>
                        <input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onBlur={() => void commitRename()} onKeyDown={(event) => { if (event.key === 'Enter') void commitRename(); if (event.key === 'Escape') setRenamingId(null); }} className="w-full rounded-lg border border-violet-300 px-2 py-1.5 text-lg font-semibold outline-none ring-4 ring-violet-100" />
                      </label>
                    ) : (
                      <h2 className="mb-2 truncate text-xl font-semibold text-slate-950">{flowchart.name}</h2>
                    )}

                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      Edited {formatDate(flowchart.updated_at)}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-slate-100 pt-4">
                      <CardAction label="Rename diagram" icon={Pencil} onClick={() => startRename(flowchart)} />
                      <CardAction label="Duplicate diagram" icon={Copy} onClick={() => void duplicateDiagram(flowchart.id)} />
                      <CardAction label="Export diagram as JSON" icon={Download} onClick={() => exportDiagram(flowchart)} />
                      <CardAction label="Delete diagram" icon={Trash2} destructive onClick={() => setDeletingId(flowchart.id)} />
                      <button type="button" onClick={() => navigate(`/editor/${flowchart.id}`)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                        Open <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                <h2 className="mt-4 text-xl font-semibold">No matching diagrams</h2>
                <p className="mt-2 text-sm text-slate-500">Try a different name.</p>
              </div>
            )}
          </>
        )}
      </main>

      <ConfirmModal isOpen={deletingId !== null} title="Delete diagram?" message="This permanently removes the diagram from this browser. Export a backup first if you may need it later." confirmText="Delete diagram" cancelText="Keep diagram" onConfirm={() => void confirmDelete()} onCancel={() => setDeletingId(null)} />
      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function EmptyDashboard({ onCreate }: { onCreate: (templateId: StarterTemplateId) => Promise<void> }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[var(--wf-shadow-sm)] sm:p-9">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><FileText className="h-7 w-7" aria-hidden="true" /></div>
        <h2 className="mt-5 text-3xl font-bold tracking-tight">Create your first diagram</h2>
        <p className="mt-3 text-base leading-7 text-slate-600">Start blank or use a local template. Everything remains editable and saves automatically in this browser.</p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {starterTemplates.map((template) => (
          <button key={template.id} type="button" onClick={() => void onCreate(template.id)} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm"><LayoutTemplate className="h-5 w-5" aria-hidden="true" /></div>
            <h3 className="font-semibold text-slate-950">{template.name}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{template.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function CardAction({ label, icon: Icon, onClick, destructive = false }: { label: string; icon: typeof Pencil; onClick: () => void; destructive?: boolean }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${destructive ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}><Icon className="h-4 w-4" aria-hidden="true" /></button>;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function safeFilename(value: string) {
  return value.trim().replace(/[^a-z0-9-_]+/gi, '_') || 'wizzleflow-diagram';
}
