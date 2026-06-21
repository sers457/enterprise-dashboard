import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { CommandPalette } from '@/components/UI/CommandPalette';

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isOpen: isCommandOpen, open: openCommand, close: closeCommand } = useCommandPalette();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-950">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className={cn(
        'transition-all duration-300 ease-out',
        sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
      )}>
        <Header
          onMenuToggle={() => setMobileSidebarOpen(true)}
          onCommandPaletteOpen={openCommand}
        />

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <CommandPalette isOpen={isCommandOpen} onClose={closeCommand} />
    </div>
  );
}
