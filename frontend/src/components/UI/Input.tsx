import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'glass';
  floating?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, variant = 'default', floating, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const [focused, setFocused] = useState(false);

    const baseStyles = 'w-full rounded-lg px-4 py-2.5 text-sm transition-all duration-200 outline-none';
    const variantStyles = {
      default:
        'bg-neutral-50 dark:bg-dark-800 border border-neutral-200 dark:border-neutral-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400',
      glass:
        'bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 focus:border-white/40 text-white placeholder-white/50',
    };
    const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '';

    return (
      <div className="relative">
        {label && !floating && (
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
            className={cn(
              baseStyles,
              variantStyles[variant],
              errorStyles,
              icon && 'pl-10',
              isPassword && 'pr-10',
              floating && 'pt-6 pb-2',
              className
            )}
            placeholder={floating ? ' ' : props.placeholder}
            {...props}
          />
          {floating && label && (
            <label className={cn(
              'absolute left-4 transition-all duration-200 pointer-events-none',
              focused || props.value
                ? 'top-1 text-[10px] text-primary-500 dark:text-primary-400'
                : 'top-1/2 -translate-y-1/2 text-sm text-neutral-400'
            )}>
              {label}
            </label>
          )}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
