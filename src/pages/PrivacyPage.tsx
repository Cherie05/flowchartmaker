import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--wf-bg)] px-4 py-12 text-slate-900 sm:px-8 sm:py-20">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 font-medium text-violet-700 transition hover:text-violet-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>

        <h1 className="mb-8 text-4xl font-bold tracking-tight">Privacy</h1>
        <p className="mb-8 text-lg leading-8 text-slate-600">
          Wizzleflow is designed as a direct-access, local-first diagram editor.
        </p>

        <div className="space-y-8 leading-7 text-slate-700">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-slate-900">No account or email required</h2>
            <p>Wizzleflow does not require an account, name, or email address to use the workspace.</p>
          </section>
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-slate-900">Local diagram storage</h2>
            <p>Diagrams and workspace preferences are stored in your browser's local storage on the device you use. They are not automatically synchronized to another browser or device.</p>
          </section>
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-slate-900">Backups and deletion</h2>
            <p>Clearing browser storage can permanently remove saved diagrams. Export important diagrams regularly so you have a backup you control.</p>
          </section>
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-slate-900">Optional AI generation</h2>
            <p>When you explicitly click Generate, the process description you entered is sent through Wizzleflow's server to Google's Gemini service to create a proposed flowchart. The Gemini API key remains on the server. Your saved diagrams remain in browser local storage and are not automatically synchronized.</p>
          </section>
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-slate-900">Website delivery</h2>
            <p>The website host and externally loaded assets, such as fonts, may receive standard network request information. The Wizzleflow application does not send diagram content to a diagram-storage service.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
