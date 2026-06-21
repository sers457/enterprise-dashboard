import { useThemeStore } from '@/store/themeStore';

const regions = [
  { region: 'North America', value: 42, color: '#6366f1' },
  { region: 'Europe', value: 28, color: '#8b5cf6' },
  { region: 'Asia Pacific', value: 18, color: '#10b981' },
  { region: 'Middle East', value: 7, color: '#f59e0b' },
  { region: 'Latin America', value: 4, color: '#f97316' },
  { region: 'Africa', value: 1, color: '#ef4444' },
];

export function GeoChart() {
  const isDark = useThemeStore((s) => s.resolvedTheme === 'dark');

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Geographic Distribution</h3>
      <p className="text-sm text-neutral-500 mb-6">Revenue by region</p>
      <div className="space-y-4">
        {regions.map((r) => (
          <div key={r.region}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{r.region}</span>
              </div>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">{r.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${r.value}%`, backgroundColor: r.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
