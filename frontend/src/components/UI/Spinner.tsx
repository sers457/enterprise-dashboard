import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-[3px]',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400',
        sizes[size],
        className
      )}
    />
  );
}
