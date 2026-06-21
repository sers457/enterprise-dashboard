import { cn } from '@/lib/utils';

interface NeuCardProps {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
  onClick?: () => void;
}

export function NeuCard({ children, className, inset = false, onClick }: NeuCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl p-6',
        inset ? 'neu-inset' : 'neu',
        'transition-all duration-300',
        !inset && 'hover:shadow-[8px_8px_16px_#c5c5c5,-8px_-8px_16px_#ffffff] dark:hover:shadow-[8px_8px_16px_#050508,-8px_-8px_16px_#2a2a38]',
        className
      )}
    >
      {children}
    </div>
  );
}
