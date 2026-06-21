import { useState } from 'react';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Toggle } from '@/components/UI/Toggle';
import type { User, UserRole } from '@/types';

interface UserFormProps {
  user?: User;
  onClose: () => void;
}

export function UserForm({ user, onClose }: UserFormProps) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
    role: user?.role || 'user' as UserRole,
    isActive: user?.isActive ?? true,
    isMFAEnabled: user?.isMFAEnabled ?? false,
  });

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(e) => updateField('firstName', e.target.value)}
          placeholder="John"
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => updateField('lastName', e.target.value)}
          placeholder="Doe"
        />
      </div>
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => updateField('email', e.target.value)}
        placeholder="user@company.com"
      />
      <Input
        label="Username"
        value={formData.username}
        onChange={(e) => updateField('username', e.target.value)}
        placeholder="johndoe"
      />
      {!user && (
        <Input
          label="Password"
          type="password"
          placeholder="Set initial password"
        />
      )}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Role</label>
        <select
          value={formData.role}
          onChange={(e) => updateField('role', e.target.value)}
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        >
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <div className="space-y-3">
        <Toggle
          label="Active"
          checked={formData.isActive}
          onChange={(v) => updateField('isActive', v)}
        />
        <Toggle
          label="Require MFA"
          checked={formData.isMFAEnabled}
          onChange={(v) => updateField('isMFAEnabled', v)}
        />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" variant="primary" className="flex-1">{user ? 'Update' : 'Create'} User</Button>
      </div>
    </form>
  );
}
