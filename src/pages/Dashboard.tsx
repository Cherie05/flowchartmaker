import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flowchartService } from '../services/flowchartService';
import {
  ArrowRight,
  Clock3,
  Copy,
  LayoutTemplate,
  Loader,
  Plus,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { getErrorMessage } from '../lib/errors';
import { ConfirmModal } from '../components/ConfirmModal';
import type { FlowChartRecord } from '../types/flowChart';
import { CustomCursor } from '../components/CustomCursor';
import { Logo } from '../components/Logo';

export function Dashboard() {
  const navigate = useNavigate();
  const [flowcharts, setFlowcharts] = useState<FlowChartRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWarning, setShowWarning] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const userName = localStorage.getItem('user_name') || 'Creator';

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
        name: 'Untitled Flowchart',
        nodes: [],
        connections: []
      });
      navigate(`/editor/${newFlowchart.id}`);
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to create a new flowchart.'));
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await flowchartService.deleteFlowchart(deletingId);
      setFlowcharts(currentFlowcharts => currentFlowcharts.filter(flowchart => flowchart.id !== deletingId));
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to delete the flowchart.'));
    } finally {
      setDeletingId(null);
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
    <div className="min-h-screen bg-[#efe8dc] text-slate-900 font-sans cursor-none">
      <CustomCursor />
      
      {/* Minimalist Header */}
      <header className="border-b border-slate-300 bg-white/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
             <span className="text-sm font-medium text-slate-500">Welcome, {userName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Warning Banner */}
        {showWarning && (
          <div className="mb-12 relative overflow-hidden rounded-2xl bg-[#fff9ed] border border-[#ffdb99] p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-[#d97706]" />
              </div>
              <div className="flex-1 pr-8">
                <h3 className="text-lg font-bold text-[#92400e] uppercase tracking-tight mb-1">
                  Local Storage Privacy Notice
                </h3>
                <p className="text-[#b45309] font-medium">
                  To ensure maximum privacy, FlowForge currently stores all your flowchart data directly in your browser's Local Storage.
                  <strong className="block mt-1 font-bold text-[#92400e]">
                    WARNING: If you log in on a different device, or clear your browser data/cache, you will lose access to these flowcharts. Please export your critical data regularly.
                  </strong>
                </p>
              </div>
              <button 
                onClick={() => setShowWarning(false)}
                className="absolute top-6 right-6 text-[#d97706] hover:text-[#92400e] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Title & Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">Your Boards</h1>
            <p className="text-lg text-slate-600 font-light">
              Manage and edit your locally saved flowcharts.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-indigo-600 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            New Board
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {error && (
          <div className="mb-8 rounded-xl bg-red-50 p-4 text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {/* Flowcharts Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : flowcharts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center border-2 border-dashed border-slate-300 rounded-3xl bg-white/50">
            <LayoutTemplate className="h-16 w-16 text-slate-300 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No boards yet</h3>
            <p className="text-slate-500 max-w-sm mb-8">
              Create your first flowchart to start mapping out your ideas visually.
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create First Board
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {flowcharts.map((flowchart) => (
              <div
                key={flowchart.id}
                className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#efe8dc] text-slate-900">
                    <LayoutTemplate className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleDuplicate(flowchart.id)}
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(flowchart.id)}
                      className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="mb-2 text-xl font-bold text-slate-900 truncate">
                  {flowchart.name}
                </h3>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDate(flowchart.updatedAt)}
                  </div>
                  
                  <button
                    onClick={() => navigate(`/editor/${flowchart.id}`)}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Edit Board
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={deletingId !== null}
        title="Delete Board"
        message="Are you absolutely sure you want to delete this flowchart? This action cannot be undone and your data will be permanently lost."
        confirmText="Delete Forever"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
