import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'default' | 'glass' | 'pills';
}

export function Tabs({ tabs, activeTab, onChange, className, variant = 'default' }: TabsProps) {
  const variants = {
    default: {
      container: 'border-b border-neutral-200 dark:border-neutral-800',
      tab: 'px-4 py-3 text-sm font-medium border-b-2 border-transparent -mb-px',
      active: 'text-primary-600 dark:text-primary-400 border-primary-500',
      inactive: 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
    },
    glass: {
      container: 'glass rounded-xl p-1',
      tab: 'px-4 py-2 text-sm font-medium rounded-lg',
      active: 'bg-primary-500 text-white shadow-lg shadow-primary-500/25',
      inactive: 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
    },
    pills: {
      container: 'flex gap-1',
      tab: 'px-4 py-2 text-sm font-medium rounded-full',
      active: 'bg-primary-500 text-white shadow-lg shadow-primary-500/25',
      inactive: 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800',
    },
  };

  const v = variants[variant];

  return (
    <div className={cn('flex items-center', v.container, className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-2 transition-all duration-200',
            v.tab,
            activeTab === tab.id ? v.active : v.inactive
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
              activeTab === tab.id
                ? 'bg-primary-500/20 text-primary-600 dark:text-primary-300'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
            )}>
              {tab.count}
            </span>
          )}
          {variant === 'default' && activeTab === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
            />
          )}
        </button>
      ))}
    </div>
  );
}
