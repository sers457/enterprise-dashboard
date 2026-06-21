import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  const typeColors: Record<string, string> = {
    default: 'bg-neutral-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
  };

  return (
    <div className={cn('space-y-0', className)}>
      {items.map((item, idx) => (
        <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
          {idx < items.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-neutral-200 dark:bg-neutral-800" />
          )}
          <div className="flex flex-col items-center">
            {item.icon ? (
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-white',
                typeColors[item.type || 'default']
              )}>
                {item.icon}
              </div>
            ) : (
              <div className={cn('w-6 h-6 rounded-full border-2 border-white dark:border-dark-950', typeColors[item.type || 'default'])} />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.title}</p>
            {item.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{item.description}</p>
            )}
            <p className="text-[10px] text-neutral-400 mt-1">{formatRelativeTime(item.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
