import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { Dropdown } from '@/components/UI/Dropdown';
import { Avatar } from '@/components/UI/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

export function UserDropdown() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { resolvedTheme, toggleMode } = useThemeStore();

  const items = [
    { label: 'Profile', icon: <User className="h-4 w-4" />, onClick: () => navigate('/settings') },
    { label: 'Settings', icon: <Settings className="h-4 w-4" />, onClick: () => navigate('/settings') },
    {
      label: resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode',
      icon: resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      onClick: () => toggleMode(),
    },
    { divider: true } as const,
    { label: 'Logout', icon: <LogOut className="h-4 w-4" />, onClick: () => { logout(); navigate('/login'); }, danger: true },
  ];

  return (
    <Dropdown
      trigger={
        <div className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-800 transition-colors cursor-pointer">
          <Avatar
            name={`${user?.firstName || 'J'} ${user?.lastName || 'D'}`}
            size="sm"
            status="online"
          />
          <div className="hidden lg:block text-left">
            <p className="text-sm font-medium text-neutral-900 dark:text-white leading-tight">
              {user?.firstName || 'John'} {user?.lastName || 'Doe'}
            </p>
            <p className="text-[10px] text-neutral-400 leading-tight">{user?.role || 'Super Admin'}</p>
          </div>
        </div>
      }
      items={items as typeof items}
    />
  );
}
