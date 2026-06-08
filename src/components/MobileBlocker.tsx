import { MonitorSmartphone } from 'lucide-react';

export function MobileBlocker() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#efe8dc] p-8 text-center text-slate-900 md:hidden">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 shadow-xl">
        <MonitorSmartphone className="h-10 w-10 text-white" />
      </div>
      <h1 className="mb-4 text-3xl font-black uppercase tracking-tighter">
        Desktop Required
      </h1>
      <p className="max-w-xs text-lg font-light text-slate-600">
        Wizzleflow is a professional flowcharting tool optimized for larger screens.
        Please switch to a desktop or laptop computer to access the editor.
      </p>
    </div>
  );
}
