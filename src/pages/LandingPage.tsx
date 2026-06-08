import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ReactLenis } from 'lenis/react';
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  Zap,
  ExternalLink,
  Code,
  Briefcase,
  Heart,
  Github
} from 'lucide-react';
import { CustomCursor } from '../components/CustomCursor';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

export function LandingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Parallax effects
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const opacityFade = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubmitError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { error } = await supabase.from('waitlist').insert([{ name, email }]);
      if (error) throw error;
      setIsSubmitted(true);
      setEmail('');
    } catch (err: unknown) {
      console.error(err);
      const pgError = err as { code?: string; message?: string };
      if (pgError.code === '23505') {
        // Postgres unique constraint violation (already on waitlist)
        setIsSubmitted(true);
        setEmail('');
      } else {
        setSubmitError(pgError.message || 'Failed to join waitlist. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const textRevealVariants = {
    hidden: { y: '120%', opacity: 0, rotate: 5 },
    visible: (i: number) => ({
      y: '0%',
      opacity: 1,
      rotate: 0,
      transition: {
        delay: i * 0.05,
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  return (
    <ReactLenis root options={{ lerp: 0.05, smoothWheel: true }}>
      <div ref={containerRef} className="relative bg-[#efe8dc] text-slate-900 selection:bg-indigo-200 overflow-hidden cursor-none font-sans">
        <CustomCursor />

        {/* Minimalist Grid Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Fixed Navigation */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-8 md:px-16 w-full mix-blend-difference text-white"
        >
          <Logo
            iconContainerClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
            iconClassName="h-6 w-6 text-black"
            textClassName="text-2xl font-black tracking-tighter text-white"
          />
          <button
            onClick={() => navigate('/auth')}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-white/20 bg-transparent px-8 py-3 text-sm font-medium transition-all hover:bg-white hover:text-black"
          >
            <span>Try Tool</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.nav>

        {/* Hero Section */}
        <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-32 pb-24 text-center md:px-12">
          <motion.div style={{ y: yText, opacity: opacityFade }} className="flex flex-col items-center w-full max-w-[90vw] 2xl:max-w-[1400px]">

            <div className="overflow-hidden mb-12">
              <motion.h1
                className="text-[12vw] 2xl:text-[200px] font-black tracking-tighter leading-[0.85] uppercase"
              >
                {'Diagram at'.split(' ').map((word, i) => (
                  <span key={`l1-${i}`} className="inline-block overflow-hidden pb-4">
                    <motion.span
                      custom={i}
                      variants={textRevealVariants}
                      initial="hidden"
                      animate="visible"
                      className="inline-block mr-[3vw] text-slate-900"
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
                <br />
                {'speed of thought'.split(' ').map((word, i) => (
                  <span key={`l2-${i}`} className="inline-block overflow-hidden pb-4">
                    <motion.span
                      custom={i + 2}
                      variants={textRevealVariants}
                      initial="hidden"
                      animate="visible"
                      className="inline-block mr-[3vw] text-slate-900"
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </motion.h1>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1.5 }}
              className="w-full max-w-2xl border-t border-slate-200 pt-8 mt-4 flex flex-col md:flex-row justify-between items-start text-left gap-8"
            >
              <p className="text-lg text-slate-600 font-light max-w-sm">
                Create stunning flowcharts, process maps, and diagrams with a premium, distraction-free canvas.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="group inline-flex items-center gap-4 text-lg font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <span>Start Creating</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
            </motion.div>

          </motion.div>
        </section>

        {/* Features Showcase */}
        <section className="relative z-20 bg-[#f7f3ea] py-32 md:py-48 border-t border-slate-300">
          <div className="max-w-[90vw] 2xl:max-w-[1400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="mb-32 flex flex-col md:flex-row justify-between items-end gap-8"
            >
              <h2 className="text-6xl md:text-[8vw] 2xl:text-[140px] font-black tracking-tighter leading-[0.9] uppercase">
                Intelligent<br />
                <span className="text-slate-300">Invisible</span>
              </h2>
              <p className="text-xl text-slate-500 max-w-md pb-4 font-light">
                We removed the clutter so you can focus on the logic. The interface disappears when you don't need it.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 border border-slate-200">
              {[
                {
                  title: "Board-First UX",
                  desc: "Infinite canvas, magnetic connections, and instant layout. Built for speed and precision.",
                  icon: <Layers className="h-6 w-6 text-slate-900" />,
                  delay: 0.1
                },
                {
                  title: "AI Generation",
                  desc: "Describe your process. We build the skeleton. You refine the details in seconds.",
                  icon: <Zap className="h-6 w-6 text-slate-900" />,
                  delay: 0.2
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: feature.delay }}
                  className="group relative bg-white p-16 md:p-24 transition-colors hover:bg-[#efe8dc]"
                >
                  <div className="mb-12 inline-flex rounded-full border border-slate-200 p-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-4xl font-bold tracking-tight mb-6">{feature.title}</h3>
                  <p className="text-xl text-slate-500 font-light leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* About Author Section */}
        <section className="relative z-10 w-full bg-white py-32 md:py-48 px-6 border-t border-slate-200">
          <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1 space-y-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-800">
                <Code className="h-4 w-4" />
                Meet the Developer
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Arunvpp</h2>
              <p className="text-xl text-slate-600 font-light leading-relaxed">
                Software Development Engineer bridging the gap between modern frontend architecture and artificial intelligence.
              </p>
              <p className="text-lg text-slate-500 leading-relaxed">
                Expert in building dynamic web applications, offline-first mobile systems using React Native, and engineering AI products including local LLMs and scalable Next.js architectures.
              </p>

              <div className="pt-6 flex flex-wrap gap-4">
                <a
                  href="https://arunvpp.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition-all hover:bg-indigo-600"
                >
                  View Portfolio
                  <ExternalLink className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 w-full"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-slate-200 bg-[#f8f9fa] p-8 transition-transform hover:-translate-y-2">
                  <Briefcase className="h-8 w-8 text-indigo-500 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Projects</h3>
                  <p className="text-sm text-slate-500">Nexura-Gemma2B, Reynox, BluNote (Offline-first apps)</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-[#f8f9fa] p-8 transition-transform hover:-translate-y-2 sm:translate-y-8">
                  <Layers className="h-8 w-8 text-indigo-500 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Expertise</h3>
                  <p className="text-sm text-slate-500">React, Next.js, React Native, AI/Local LLMs, Tailwind</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Open Opportunities Section */}
        <section className="relative z-10 w-full bg-[#f8f9fa] py-24 md:py-32 px-6 border-t border-slate-200">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">Let's Collaborate</h2>
              <p className="text-lg text-slate-500 font-light max-w-2xl mx-auto">
                Whether you're looking to build something amazing together, contribute to open source, or support my work.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Contributions */}
              <motion.div
                whileHover={{ y: -8 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6">
                  <Github className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Open for Contributions</h3>
                <p className="text-slate-500 mb-0 flex-1">
                  Wizzleflow is open for developers to collaborate. Feel free to submit pull requests or report issues.
                </p>
              </motion.div>

              {/* Projects */}
              <motion.div
                whileHover={{ y: -8 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6">
                  <Briefcase className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Open to Projects</h3>
                <p className="text-slate-500 mb-0 flex-1">
                  Available for freelance opportunities and consulting. Let's build your next SaaS or AI product.
                </p>
              </motion.div>

              {/* Funding */}
              <motion.div
                whileHover={{ y: -8 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6">
                  <Heart className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Open to Funding</h3>
                <p className="text-slate-500 mb-0 flex-1">
                  Support my work in building accessible, local-first tools and open source projects.
                </p>
              </motion.div>
            </div>

            <div className="mt-16 flex justify-center">
              <a
                href="https://www.linkedin.com/in/arunvpp05/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition-all hover:bg-indigo-600 hover:scale-105 shadow-md"
              >
                Let's Connect on LinkedIn
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </section>

        {/* Minimalist Footer / Waitlist */}
        <section className="relative z-10 w-full bg-[#e8e0d2] py-32 md:py-48 flex items-center justify-center border-t border-slate-300">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl px-6 flex flex-col items-center text-center"
          >
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-12">
              Ready to flow.
            </h2>

            {/* Waitlist Form */}
            <div className="w-full max-w-xl">
              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-4 py-6 text-slate-900"
                  >
                    <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                    <span className="text-2xl font-medium tracking-tight">You're on the list.</span>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    exit={{ opacity: 0, y: -20 }}
                    onSubmit={handleWaitlistSubmit}
                    className="relative flex flex-col items-center gap-6"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full border-b-2 border-slate-300 bg-transparent py-4 text-2xl text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:outline-none disabled:opacity-50 text-center"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full border-b-2 border-slate-300 bg-transparent py-4 text-2xl text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:outline-none disabled:opacity-50 text-center"
                    />
                    {submitError && <p className="text-red-500 text-sm font-medium">{submitError}</p>}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-10 py-4 text-lg font-bold text-white transition-all hover:bg-indigo-600 disabled:opacity-50 active:scale-95 mt-4"
                    >
                      {isSubmitting ? 'Wait...' : 'Join Waitlist'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-24 pt-8 border-t border-slate-300 w-full flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 font-medium">
              <p>&copy; {new Date().getFullYear()} FlowForge. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <button onClick={() => navigate('/terms')} className="hover:text-slate-900 transition-colors">Terms of Service</button>
                <button onClick={() => navigate('/privacy')} className="hover:text-slate-900 transition-colors">Privacy Policy</button>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </ReactLenis>
  );
}
