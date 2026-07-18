import type { ReactNode } from 'react';
import { ArrowLeft, MonitorSmartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MobileBlocker({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--wf-bg)] p-6 text-center text-slate-900 lg:hidden">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 shadow-lg">
          <MonitorSmartphone className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight">A little more room works better</h1>
        <p className="max-w-sm text-base leading-7 text-slate-600">
          The Wizzleflow editor currently works best on desktop or a tablet in landscape. You can still explore the product without an account or email.
        </p>
        <Link
          to="/dashboard"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to diagrams
        </Link>
      </main>
      <div className="hidden h-screen lg:block">{children}</div>
    </>
  );
}
