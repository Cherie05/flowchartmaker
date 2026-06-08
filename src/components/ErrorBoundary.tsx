import { Component, type ErrorInfo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowRight } from 'lucide-react';
import { CustomCursor } from './CustomCursor';
import { Logo } from './Logo';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#f6f1e9] font-sans selection:bg-indigo-500/30">
          <CustomCursor />
          
          {/* Header */}
          <header className="absolute top-0 left-0 w-full p-8 z-50">
             <Logo />
          </header>

          {/* Main Content */}
          <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center flex flex-col items-center"
            >
              {/* Animated 404 */}
              <div className="flex items-center justify-center gap-4 text-[10rem] md:text-[16rem] font-black tracking-tighter text-slate-900 leading-none">
                <motion.span
                  animate={{ y: [0, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                  4
                </motion.span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="flex items-center justify-center text-indigo-500"
                >
                  <Activity className="w-24 h-24 md:w-40 md:h-40" strokeWidth={2.5} />
                </motion.div>
                <motion.span
                  animate={{ y: [0, 15, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
                >
                  4
                </motion.span>
              </div>

              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mt-8 text-3xl md:text-5xl font-black tracking-tight text-slate-900"
              >
                Lost in the Flow.
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="mt-4 max-w-lg text-lg text-slate-500 font-light"
              >
                Something unexpected happened. We couldn't find the page you were looking for.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/'}
                className="mt-12 group inline-flex items-center gap-3 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition-all hover:bg-indigo-600"
              >
                Return Home
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </motion.div>

            {/* Decorative Background Elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1] 
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-indigo-200/50 blur-[120px]" 
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.1, 0.15, 0.1] 
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-[40%] -right-[10%] h-[500px] w-[500px] rounded-full bg-amber-200/50 blur-[100px]" 
              />
            </div>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}
