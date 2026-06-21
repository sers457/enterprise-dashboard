import { useState } from 'react';
import { MoreHorizontal, Plus, Search, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { DataTable } from '@/components/UI/DataTable';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { Avatar } from '@/components/UI/Avatar';
import { Dropdown } from '@/components/UI/Dropdown';
import { Modal } from '@/components/UI/Modal';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';
import { UserForm } from './UserForm';
import type { User, UserRole } from '@/types';
import { cn } from '@/lib/utils';

const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: `user-${i + 1}`,
  email: `user${i + 1}@company.com`,
  username: `user${i + 1}`,
  firstName: ['John', 'Jane', 'Mike', 'Sarah', 'Alex', 'Emily', 'David', 'Lisa'][i % 8],
  lastName: ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Wilson', 'Taylor'][i % 8],
  role: (['super_admin', 'admin', 'manager', 'user', 'viewer'] as UserRole[])[i % 5],
  permissions: [],
  isActive: i % 7 !== 0,
  isMFAEnabled: i % 3 === 0,
  lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
}));

const roleColors: Record<UserRole, string> = {
  super_admin: 'primary',
  admin: 'secondary',
  manager: 'success',
  user: 'info',
  viewer: 'default',
};

export default function UserList() {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const columns = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      width: '250px',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-neutral-400">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user: User) => (
        <Badge variant={roleColors[user.role] as 'primary' | 'secondary' | 'success' | 'info' | 'default'} size="sm">
          {user.role.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user: User) => (
        <span className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium',
          user.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', user.isActive ? 'bg-emerald-500' : 'bg-neutral-400')} />
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'isMFAEnabled',
      header: 'MFA',
      render: (user: User) => (
        user.isMFAEnabled ? <Badge variant="success" size="sm">Enabled</Badge> : <Badge variant="default" size="sm">Disabled</Badge>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      sortable: true,
      render: (user: User) => (
        <span className="text-sm text-neutral-500">
          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (user: User) => (
        <Dropdown
          trigger={<MoreHorizontal className="h-4 w-4 text-neutral-400" />}
          items={[
            { label: 'Edit', onClick: () => { setSelectedUser(user); setShowForm(true); } },
            { label: 'View Profile', onClick: () => {} },
            { label: 'Reset Password', onClick: () => {} },
            { divider: true } as const,
            { label: user.isActive ? 'Deactivate' : 'Activate', danger: true, onClick: () => {} },
          ]}
        />
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Users</h1>
          <Breadcrumb />
        </div>
        <Button variant="primary" onClick={() => { setSelectedUser(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={mockUsers as unknown as Record<string, unknown>[]}
        keyExtractor={(item) => (item as unknown as User).id}
        searchable
        searchKeys={['firstName', 'lastName', 'email']}
        selectable
        exportable
        pageSize={10}
        onRowClick={(item) => setSelectedUser(item as unknown as User)}
      />

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={selectedUser ? 'Edit User' : 'Add User'}
        size="lg"
      >
        <UserForm
          user={selectedUser || undefined}
          onClose={() => setShowForm(false)}
        />
      </Modal>
    </motion.div>
  );
}
