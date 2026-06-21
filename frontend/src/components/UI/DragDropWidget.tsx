import { useDashboardStore } from '@/store/dashboardStore';
import type { DashboardWidget } from '@/types';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragDropWidgetProps {
  widget: DashboardWidget;
  children: React.ReactNode;
  className?: string;
}

export function DragDropWidget({ widget, children, className }: DragDropWidgetProps) {
  const { isEditing } = useDashboardStore();

  return (
    <div
      className={cn(
        'relative rounded-2xl transition-all duration-200',
        'bg-white dark:bg-dark-900/50 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-lg',
        isEditing && 'ring-2 ring-primary-500/30 ring-dashed',
        className
      )}
    >
      {isEditing && (
        <div className="absolute top-3 left-3 z-10 p-1 rounded-lg bg-neutral-100 dark:bg-dark-800 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-neutral-400" />
        </div>
      )}
      {children}
    </div>
  );
}
