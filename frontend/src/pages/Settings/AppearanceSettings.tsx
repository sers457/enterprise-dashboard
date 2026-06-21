import { GlassCard } from '@/components/UI/GlassCard';
import { useThemeStore } from '@/store/themeStore';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppearanceSettings() {
  const { mode, setMode } = useThemeStore();

  const themes = [
    { id: 'light', label: 'Light', icon: <Sun className="h-5 w-5" />, description: 'Clean and bright interface' },
    { id: 'dark', label: 'Dark', icon: <Moon className="h-5 w-5" />, description: 'Dark mode for reduced eye strain' },
    { id: 'system', label: 'System', icon: <Monitor className="h-5 w-5" />, description: 'Follows your system preference' },
  ] as const;

  return (
    <div className="max-w-2xl space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={cn(
                'p-5 rounded-2xl border-2 transition-all duration-200 text-center',
                mode === t.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors',
                mode === t.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 dark:bg-dark-800 text-neutral-500'
              )}>
                {t.icon}
              </div>
              <p className="font-semibold text-sm text-neutral-900 dark:text-white">{t.label}</p>
              <p className="text-xs text-neutral-400 mt-1">{t.description}</p>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Layout Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Compact Mode</p>
              <p className="text-sm text-neutral-500">Reduce spacing for a denser layout</p>
            </div>
            <div className="w-11 h-6 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Reduced Motion</p>
              <p className="text-sm text-neutral-500">Minimize animations and transitions</p>
            </div>
            <div className="w-11 h-6 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
