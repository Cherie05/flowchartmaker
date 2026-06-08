import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CustomCursor } from '../components/CustomCursor';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[#efe8dc] text-slate-900 font-sans cursor-none py-20 px-8">
      <CustomCursor />
      <div className="max-w-3xl mx-auto bg-white p-12 rounded-3xl shadow-sm border border-slate-200">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl font-black mb-8 uppercase tracking-tighter">Terms of Service</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using Wizzleflow, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily use Wizzleflow for personal or commercial use, subject to the following restrictions:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>You may not modify or copy the underlying code.</li>
            <li>You may not use the materials for any illegal purpose.</li>
            <li>You may not attempt to decompile or reverse engineer any software contained on the site.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. User Content</h2>
          <p className="mb-4">
            You retain all rights to any flowcharts or diagrams you create using Wizzleflow. We claim no ownership over your generated content.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Disclaimer</h2>
          <p className="mb-4">
            The materials on Wizzleflow are provided on an 'as is' basis. Wizzleflow makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Limitations</h2>
          <p className="mb-4">
            In no event shall Wizzleflow or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Wizzleflow.
          </p>
        </div>
      </div>
    </div>
  );
}
