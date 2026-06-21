import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, Layout, Users, BarChart3, Settings, Brain, FileText, TrendingUp, Database, Activity, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: 'Navigation' | 'Actions' | 'AI';
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toggleMode } = useThemeStore();
  const { logout } = useAuthStore();

  const commands: CommandItem[] = [
    { id: 'dashboard', label: 'Go to Dashboard', description: 'View executive dashboard', icon: <Layout className="h-4 w-4" />, category: 'Navigation', action: () => { navigate('/dashboard'); onClose(); } },
    { id: 'users', label: 'Go to Users', description: 'Manage users', icon: <Users className="h-4 w-4" />, category: 'Navigation', action: () => { navigate('/users'); onClose(); } },
    { id: 'analytics', label: 'Go to Analytics', description: 'View analytics', icon: <BarChart3 className="h-4 w-4" />, category: 'Navigation', action: () => { navigate('/analytics'); onClose(); } },
    { id: 'crm', label: 'Go to CRM', description: 'Customer management', icon: <Users className="h-4 w-4" />, category: 'Navigation', action: () => { navigate('/crm'); onClose(); } },
    { id: 'finance', label: 'Go to Finance', description: 'Financial overview', icon: <TrendingUp className="h-4 w-4" />, category: 'Navigation', action: () => { navigate('/finance'); onClose(); } },
    { id: 'inventory', label: 'Go to Inventory', description: 'Manage inventory', icon: <Database className="h-4 w-4" />, category: 'Navigation', action: () => { navigate('/inventory'); onClose(); } },
    { id: 'ai', label: 'Go to AI Command Center', description: 'AI tools and insights', icon: <Brain className="h-4 w-4" />, category: 'Navigation', action: () => { navigate('/ai'); onClose(); } },
    { id: 'settings', label: 'Go to Settings', description: 'App settings', icon: <Settings className="h-4 w-4" />, category: 'Navigation', action: () => { navigate('/settings'); onClose(); } },
    { id: 'reports', label: 'Generate Report', description: 'Create new analytics report', icon: <FileText className="h-4 w-4" />, category: 'Actions', action: () => { navigate('/analytics'); onClose(); } },
    { id: 'export', label: 'Export Data', description: 'Export current view as CSV/Excel', icon: <Activity className="h-4 w-4" />, category: 'Actions', action: () => { onClose(); } },
    { id: 'theme', label: 'Toggle Theme', description: 'Switch between dark and light mode', icon: <Sun className="h-4 w-4" />, category: 'Actions', action: () => { toggleMode(); onClose(); } },
    { id: 'logout', label: 'Logout', description: 'Sign out of the dashboard', icon: <LogOut className="h-4 w-4" />, category: 'Actions', action: () => { logout(); onClose(); } },
  ];

  const filtered = query
    ? commands.filter((cmd) =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
    }
  }, [filtered, selectedIndex]);

  const categories = [...new Set(filtered.map((c) => c.category))];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl z-10"
          >
            <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                <Search className="h-5 w-5 text-neutral-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-900 dark:text-white placeholder-neutral-400"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-400 bg-neutral-100 dark:bg-dark-800 rounded">
                  <Command className="h-3 w-3" />K
                </kbd>
              </div>
              <div className="max-h-96 overflow-y-auto p-2 scrollbar-thin">
                {categories.map((cat) => (
                  <div key={cat}>
                    <p className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">{cat}</p>
                    {filtered.filter((c) => c.category === cat).map((cmd, idx) => {
                      const globalIdx = filtered.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                            globalIdx === selectedIndex
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-800'
                          )}
                        >
                          <span className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            globalIdx === selectedIndex ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'bg-neutral-100 dark:bg-dark-800 text-neutral-500'
                          )}>
                            {cmd.icon}
                          </span>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{cmd.label}</p>
                            {cmd.description && (
                              <p className="text-xs text-neutral-400">{cmd.description}</p>
                            )}
                          </div>
                          <ArrowRight className={cn(
                            'h-4 w-4',
                            globalIdx === selectedIndex ? 'text-primary-500' : 'text-neutral-300'
                          )} />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
