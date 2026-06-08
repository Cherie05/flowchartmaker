import { Activity } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({
  className = 'flex items-center gap-2.5',
  iconContainerClassName = 'flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 shadow-sm',
  iconClassName = 'h-5 w-5 text-white',
  textClassName = 'text-2xl font-black tracking-tight text-slate-900',
  showText = true,
}: LogoProps) {
  return (
    <div className={className}>
      <div className={iconContainerClassName}>
        <Activity className={iconClassName} strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={textClassName} style={{ letterSpacing: '-0.05em' }}>
          Wizzleflow
        </span>
      )}
    </div>
  );
}
