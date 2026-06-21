import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Smartphone } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { useAuthStore } from '@/store/authStore';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { register, isLoading, error, clearError } = useAuthStore();

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.firstName) errs.firstName = 'Required';
    if (!formData.lastName) errs.lastName = 'Required';
    if (!formData.email) errs.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Invalid email';
    if (!formData.username) errs.username = 'Required';
    else if (formData.username.length < 3) errs.username = 'Min 3 characters';
    if (!formData.password) errs.password = 'Required';
    else if (formData.password.length < 8) errs.password = 'Min 8 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    try {
      await register(formData);
      onSuccess?.();
    } catch {
      // handled in store
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First Name"
          placeholder="John"
          value={formData.firstName}
          onChange={(e) => updateField('firstName', e.target.value)}
          icon={<User className="h-4 w-4" />}
          error={errors.firstName}
        />
        <Input
          label="Last Name"
          placeholder="Doe"
          value={formData.lastName}
          onChange={(e) => updateField('lastName', e.target.value)}
          error={errors.lastName}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="you@company.com"
        value={formData.email}
        onChange={(e) => updateField('email', e.target.value)}
        icon={<Mail className="h-4 w-4" />}
        error={errors.email}
      />

      <Input
        label="Username"
        placeholder="johndoe"
        value={formData.username}
        onChange={(e) => updateField('username', e.target.value)}
        icon={<Smartphone className="h-4 w-4" />}
        error={errors.username}
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a strong password"
          value={formData.password}
          onChange={(e) => updateField('password', e.target.value)}
          icon={<Lock className="h-4 w-4" />}
          error={errors.password}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-neutral-400"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Repeat your password"
        value={formData.confirmPassword}
        onChange={(e) => updateField('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
      />

      <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
        Create Account
      </Button>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <button type="button" onClick={onLoginClick} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
          Sign in
        </button>
      </p>
    </form>
  );
}
