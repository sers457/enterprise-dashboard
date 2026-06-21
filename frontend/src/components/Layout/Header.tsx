import { useState, useRef } from 'react';
import { Search, Menu, Sun, Moon, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';
import { NotificationBell } from '@/components/UI/NotificationBell';
import { UserDropdown } from './UserDropdown';

interface HeaderProps {
  onMenuToggle: () => void;
  onCommandPaletteOpen: () => void;
}

export function Header({ onMenuToggle, onCommandPaletteOpen }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme, toggleMode } = useThemeStore();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-dark-950/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-800 transition-colors lg:hidden"
          >
            <Menu className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </button>

          <div className={cn(
            'hidden md:flex items-center gap-2 rounded-xl transition-all duration-300',
            searchFocused
              ? 'bg-white dark:bg-dark-800 shadow-lg border border-primary-500/30 dark:border-primary-500/20'
              : 'bg-neutral-100 dark:bg-dark-800/50 border border-transparent',
            'px-3 py-2 min-w-[240px] lg:min-w-[320px]'
          )}>
            <Search className={cn('h-4 w-4', searchFocused ? 'text-primary-500' : 'text-neutral-400')} />
            <input
              ref={searchRef}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-900 dark:text-white placeholder-neutral-400"
            />
            {!searchFocused && (
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 bg-neutral-200 dark:bg-dark-700 rounded">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCommandPaletteOpen}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-800 transition-colors md:hidden"
          >
            <Command className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </button>

          <button
            onClick={toggleMode}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-800 transition-colors"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            ) : (
              <Moon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            )}
          </button>

          <NotificationBell />

          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
