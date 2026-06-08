import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CustomCursor } from '../components/CustomCursor';
import { Logo } from '../components/Logo';
import { supabase } from '../lib/supabase';

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    setError('');

    try {
      const { error: dbError } = await supabase.from('users').insert([{ name, email }]);
      if (dbError && dbError.code !== '23505') {
        console.warn('Could not save user. Supabase keys might be missing.', dbError);
      }

      localStorage.setItem('user_name', name);
      localStorage.setItem('user_email', email);

      // Check where they came from (e.g. if RequireAuth caught them)
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setError(errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#efe8dc] text-slate-900 font-sans cursor-none">
      <CustomCursor />

      <div className="absolute top-8 left-8">
        <Logo />
      </div>

      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-[0_20px_48px_-30px_rgba(0,0,0,0.1)] border border-slate-200 z-10">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
          Get Started
        </h1>
        <p className="text-slate-600 mb-8 font-light">
          Enter your name and email to access the editor immediately.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              required
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="w-full border-b-2 border-slate-300 bg-transparent py-3 text-lg text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:outline-none disabled:opacity-50"
            />
            <input
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="w-full border-b-2 border-slate-300 bg-transparent py-3 text-lg text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:outline-none disabled:opacity-50"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 py-4 text-base font-bold text-white transition-all hover:bg-indigo-600 disabled:opacity-50 active:scale-95"
          >
            {isSubmitting ? 'Entering...' : 'Continue to Editor'}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </form>


      </div>

      {/* Minimalist Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
         <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>
    </div>
  );
}
