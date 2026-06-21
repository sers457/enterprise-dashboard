import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store/notificationStore';
import { formatRelativeTime } from '@/lib/utils';
import { Button } from './Button';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const typeColors: Record<string, string> = {
    info: 'bg-sky-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-800 transition-colors"
      >
        <Bell className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 z-50"
          >
            <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Notifications</h3>
                <div className="flex items-center gap-1">
                  <button onClick={markAllAsRead} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-800 text-neutral-500">
                    <CheckCheck className="h-4 w-4" />
                  </button>
                  <button onClick={clearAll} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-800 text-neutral-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-neutral-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-neutral-50 dark:hover:bg-dark-800/50',
                        !notif.read && 'bg-primary-50/50 dark:bg-primary-900/5'
                      )}
                    >
                      <span className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', typeColors[notif.type])} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', !notif.read ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300')}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-neutral-400 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
