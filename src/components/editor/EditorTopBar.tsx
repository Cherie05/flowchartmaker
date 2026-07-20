import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Download, FileJson, Image as ImageIcon, Keyboard, ListChecks, MoreHorizontal, Moon, Play, Redo, SearchCheck, Sparkles, Sun, Trash2, Undo, Upload } from 'lucide-react';
import { LocalSaveStatus, type LocalSaveState } from '../../features/workspace/components/LocalSaveStatus';
import type { WorkspaceTheme } from './types';

interface EditorTopBarProps {
  flowchartName: string;
  onNameChange: (value: string) => void;
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: LocalSaveState;
  workspaceTheme: WorkspaceTheme;
  onThemeChange: (theme: WorkspaceTheme) => void;
  onImport: () => void;
  onGenerateWithAi: () => void;
  onReviewWithAi: () => void;
  onGenerateTestCasesWithAi: () => void;
  hasDiagramContent: boolean;
  onExportPng: (transparent: boolean) => void;
  onExportSvg: (transparent: boolean) => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  onPresent: () => void;
  onClearBoard: () => void;
  showHints: boolean;
  onToggleHints: () => void;
}

export function EditorTopBar(props: EditorTopBarProps) {
  const [openMenu, setOpenMenu] = useState<'export' | 'more' | null>(null);
  const [transparent, setTransparent] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const isDark = props.workspaceTheme === 'dark';

  useEffect(() => {
    const close = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenu(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenMenu(null); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);

  const shell = isDark ? 'border-white/10 bg-[#15171b]/96 text-slate-100' : 'border-slate-200 bg-white/95 text-slate-900';
  const button = isDark ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.09]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
  const menu = isDark ? 'border-white/10 bg-[#1b1d22] text-slate-100' : 'border-slate-200 bg-white text-slate-800';
  const menuItem = isDark ? 'hover:bg-white/[0.07]' : 'hover:bg-slate-50';

  return (
    <header className={`relative z-50 border-b px-3 py-2.5 backdrop-blur-xl sm:px-4 ${shell}`}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={props.onBack} aria-label="Back to dashboard" title="Back to dashboard" className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${button}`}><ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>

        <div className="min-w-0 flex-1 sm:max-w-md">
          <label className="sr-only" htmlFor="diagram-name">Diagram name</label>
          <input id="diagram-name" value={props.flowchartName} onChange={(event) => props.onNameChange(event.target.value)} className={`block w-full truncate bg-transparent text-base font-semibold outline-none sm:text-lg ${isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-950 placeholder:text-slate-400'}`} placeholder="Untitled Diagram" />
          <LocalSaveStatus status={props.saveStatus} dark={isDark} />
        </div>

        <div className="ml-auto flex items-center gap-1.5" ref={menuRef}>
          <button type="button" onClick={props.onUndo} disabled={!props.canUndo} aria-label="Undo" title="Undo (Ctrl/Cmd+Z)" className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${button}`}><Undo className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" onClick={props.onRedo} disabled={!props.canRedo} aria-label="Redo" title="Redo (Ctrl/Cmd+Shift+Z)" className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${button}`}><Redo className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" onClick={props.onImport} className={`hidden h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 lg:inline-flex ${button}`}><Upload className="h-4 w-4" aria-hidden="true" />Import</button>
          <button type="button" onClick={props.onGenerateWithAi} className={`hidden h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 md:inline-flex ${button}`}><Sparkles className="h-4 w-4 text-violet-600" aria-hidden="true" />Generate with AI</button>

          <div className="relative">
            <button type="button" onClick={() => setOpenMenu((current) => current === 'export' ? null : 'export')} aria-expanded={openMenu === 'export'} aria-haspopup="menu" className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-700 px-3 text-sm font-semibold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"><Download className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Export</span><ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /></button>
            {openMenu === 'export' && (
              <div role="menu" aria-label="Export diagram" className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border p-2 shadow-xl ${menu}`}>
                <MenuButton icon={ImageIcon} label="Export PNG" onClick={() => { props.onExportPng(transparent); setOpenMenu(null); }} className={menuItem} />
                <MenuButton icon={ImageIcon} label="Export SVG" onClick={() => { props.onExportSvg(transparent); setOpenMenu(null); }} className={menuItem} />
                <MenuButton icon={FileJson} label="Export PDF" onClick={() => { props.onExportPdf(); setOpenMenu(null); }} className={menuItem} />
                <MenuButton icon={FileJson} label="Export JSON" onClick={() => { props.onExportJson(); setOpenMenu(null); }} className={menuItem} />
                <label className={`mt-1 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs ${menuItem}`}><input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-500" />Transparent PNG/SVG background</label>
              </div>
            )}
          </div>

          <div className="relative">
            <button ref={moreButtonRef} type="button" onClick={() => setOpenMenu((current) => current === 'more' ? null : 'more')} aria-label="More diagram actions" title="More diagram actions" aria-expanded={openMenu === 'more'} aria-haspopup="menu" className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${button}`}><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></button>
            {openMenu === 'more' && (
              <div role="menu" aria-label="More diagram actions" className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border p-2 shadow-xl ${menu}`}>
                <MenuButton icon={Upload} label="Import JSON" onClick={() => { props.onImport(); setOpenMenu(null); }} className={`lg:hidden ${menuItem}`} />
                <MenuButton icon={Sparkles} label="Generate with AI" onClick={() => { props.onGenerateWithAi(); setOpenMenu(null); }} className={`md:hidden ${menuItem}`} />
                <MenuButton icon={SearchCheck} label="Review with AI" onClick={() => { props.onReviewWithAi(); setOpenMenu(null); }} className={menuItem} disabled={!props.hasDiagramContent} />
                <MenuButton icon={ListChecks} label="Generate test cases with AI" onClick={() => { props.onGenerateTestCasesWithAi(); setOpenMenu(null); }} className={menuItem} disabled={!props.hasDiagramContent} />
                <MenuButton icon={props.workspaceTheme === 'dark' ? Sun : Moon} label={props.workspaceTheme === 'dark' ? 'Use light canvas' : 'Use dark canvas'} onClick={() => props.onThemeChange(props.workspaceTheme === 'dark' ? 'light' : 'dark')} className={menuItem} />
                <MenuButton icon={Keyboard} label={props.showHints ? 'Hide canvas hints' : 'Show canvas hints'} onClick={props.onToggleHints} className={menuItem} />
                <MenuButton icon={Play} label="Presentation mode" onClick={() => { props.onPresent(); setOpenMenu(null); }} className={menuItem} />
                <div className={`my-1 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`} />
                <MenuButton icon={Trash2} label="Clear board" onClick={() => { moreButtonRef.current?.focus(); props.onClearBoard(); setOpenMenu(null); }} className="text-rose-600 hover:bg-rose-50" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuButton({ icon: Icon, label, onClick, className, disabled }: { icon: typeof Upload; label: string; onClick: () => void; className: string; disabled?: boolean }) {
  return <button type="button" role="menuitem" onClick={onClick} disabled={disabled} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}><Icon className="h-4 w-4 opacity-75" aria-hidden="true" />{label}</button>;
}
