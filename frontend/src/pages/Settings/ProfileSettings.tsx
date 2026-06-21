import { GlassCard } from '@/components/UI/GlassCard';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { Avatar } from '@/components/UI/Avatar';

export function ProfileSettings() {
  return (
    <div className="max-w-2xl space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Profile Information</h3>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <Avatar name="John Doe" size="xl" />
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">Profile Photo</p>
            <p className="text-sm text-neutral-500 mb-2">PNG, JPG up to 5MB</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">Upload</Button>
              <Button variant="ghost" size="sm">Remove</Button>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" defaultValue="John" />
            <Input label="Last Name" defaultValue="Doe" />
          </div>
          <Input label="Email" type="email" defaultValue="john.doe@company.com" />
          <Input label="Username" defaultValue="johndoe" />
          <div>
            <label className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">Bio</label>
            <textarea className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-800 px-4 py-2.5 text-sm resize-none h-24" placeholder="Write a short bio..." />
          </div>
          <Button variant="primary">Save Changes</Button>
        </div>
      </GlassCard>
    </div>
  );
}
