import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export function Avatar({ src, alt, name, size = 'md', className, status }: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const statusSizes = {
    sm: 'h-2.5 w-2.5 right-0 bottom-0',
    md: 'h-3 w-3 right-0 bottom-0',
    lg: 'h-3.5 w-3.5 right-0.5 bottom-0.5',
    xl: 'h-4 w-4 right-0.5 bottom-0.5',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-neutral-400',
    away: 'bg-amber-500',
    busy: 'bg-red-500',
  };

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="relative inline-flex">
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={cn('rounded-full object-cover', sizes[size], className)}
        />
      ) : (
        <div className={cn(
          'rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-medium',
          sizes[size],
          className
        )}>
          {initials}
        </div>
      )}
      {status && (
        <span className={cn(
          'absolute rounded-full border-2 border-white dark:border-dark-950',
          statusSizes[size],
          statusColors[status]
        )} />
      )}
    </div>
  );
}
