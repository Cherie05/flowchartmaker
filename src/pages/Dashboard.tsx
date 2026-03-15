import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flowchartService } from '../services/flowchartService';
import {
  ArrowRight,
  Clock3,
  Copy,
  FileText,
  HardDrive,
  Layers3,
  Loader,
  PencilLine,
  Plus,
  Sparkles,
  Trash2
} from 'lucide-react';
import { getErrorMessage } from '../lib/errors';
import type { FlowChartRecord } from '../types/flowChart';

export function Dashboard() {
  const navigate = useNavigate();
  const [flowcharts, setFlowcharts] = useState<FlowChartRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFlowcharts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await flowchartService.getAllFlowcharts();
      setFlowcharts(data);
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to load flowcharts.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlowcharts();
  }, [loadFlowcharts]);

  const handleCreate = async () => {
    try {
      const newFlowchart = await flowchartService.createFlowchart({
        name: 'New Flowchart',
        nodes: [],
        connections: []
      });
      navigate(`/editor/${newFlowchart.id}`);
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to create a new flowchart.'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flowchart?')) return;

    try {
      await flowchartService.deleteFlowchart(id);
      setFlowcharts(currentFlowcharts => currentFlowcharts.filter(flowchart => flowchart.id !== id));
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to delete the flowchart.'));
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await flowchartService.duplicateFlowchart(id);
      setFlowcharts(currentFlowcharts => [duplicated, ...currentFlowcharts]);
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to duplicate the flowchart.'));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,190,118,0.2),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(125,173,255,0.18),transparent_24%),linear-gradient(180deg,#f9f6ef_0%,#f4f1e8_100%)]">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-[36px] border border-white/80 bg-white/82 p-6 shadow-[0_30px_110px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-900">Whimsical-inspired</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Board-first UX</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Local mode</span>
              </div>

              <div className="flex items-start gap-4">
                <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15 sm:flex">
                  <Layers3 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-4xl leading-tight text-slate-900 sm:text-5xl">
                    Map ideas in a calmer, canvas-first workspace.
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                    Build flows from scratch or let AI draft the first pass, then refine everything in a cleaner board experience inspired by Whimsical.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                <HardDrive className="h-4 w-4 text-slate-500" />
                Saved in this browser
              </div>
              <button
                onClick={handleCreate}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                New board
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={Layers3}
              label="Boards"
              value={`${flowcharts.length}`}
              detail={flowcharts.length === 1 ? 'One saved workspace' : 'Saved workspaces ready'}
            />
            <StatCard
              icon={Sparkles}
              label="Start faster"
              value="AI drafts"
              detail="Generate a first version, then refine on the canvas."
            />
            <StatCard
              icon={HardDrive}
              label="Storage"
              value="Local"
              detail="Your boards stay in browser storage on this device."
            />
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Workspace boards</p>
              <h2 className="mt-2 text-3xl text-slate-900">Pick up where you left off</h2>
            </div>
            <p className="text-sm text-slate-600">
              {flowcharts.length} {flowcharts.length === 1 ? 'board' : 'boards'} available
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center rounded-[32px] border border-white/80 bg-white/80 px-6 py-24 shadow-[0_24px_90px_-48px_rgba(15,23,42,0.38)] backdrop-blur-xl">
              <div className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-[#fbfbf8] px-5 py-4">
                <Loader className="h-5 w-5 animate-spin text-orange-500" />
                <span className="text-sm font-medium text-slate-700">Loading boards...</span>
              </div>
            </div>
          ) : flowcharts.length === 0 ? (
            <div className="rounded-[32px] border border-white/80 bg-white/82 px-6 py-16 text-center shadow-[0_24px_90px_-48px_rgba(15,23,42,0.38)] backdrop-blur-xl sm:px-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-orange-100 text-orange-600">
                <FileText className="h-9 w-9" />
              </div>
              <h3 className="mt-6 text-3xl text-slate-900">No boards yet</h3>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600">
                Create your first workspace to start mapping flows, decisions, and ideas in the new board experience.
              </p>
              <button
                onClick={handleCreate}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Create board
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {flowcharts.map((flowchart) => (
                <article
                  key={flowchart.id}
                  className="group rounded-[30px] border border-white/80 bg-white/86 p-5 shadow-[0_24px_90px_-52px_rgba(15,23,42,0.42)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_30px_110px_-52px_rgba(15,23,42,0.48)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        <Layers3 className="h-3.5 w-3.5" />
                        {flowchart.nodes?.length || 0} nodes
                      </div>
                      <h3 className="mt-4 line-clamp-2 text-2xl leading-tight text-slate-900">
                        {flowchart.name}
                      </h3>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-[#fbfbf8] p-4">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Connections</span>
                      <span>{flowchart.connections?.length || 0}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-400 via-sky-400 to-emerald-400"
                        style={{
                          width: `${Math.min(
                            100,
                            18 + (flowchart.nodes?.length || 0) * 8 + (flowchart.connections?.length || 0) * 4
                          )}%`
                        }}
                      />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                      <Clock3 className="h-4 w-4" />
                      Updated {formatDate(flowchart.updated_at)}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/editor/${flowchart.id}`)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <PencilLine className="h-4 w-4" />
                      Open board
                    </button>
                    <button
                      onClick={() => handleDuplicate(flowchart.id)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(flowchart.id)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: typeof Layers3;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-[#fbfbf8] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}
