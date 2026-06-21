import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = false, glow = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5',
        'bg-white/70 dark:bg-dark-900/70 backdrop-blur-xl',
        'shadow-lg shadow-black/5',
        hover && 'hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 cursor-pointer',
        glow && 'glow',
        className
      )}
    >
      {children}
    </div>
  );
}
