import React from 'react';
import { LoaderCircle } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50',
  secondary: 'border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50',
  danger:    'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
  ghost:     'text-gray-600 hover:bg-gray-100 disabled:opacity-50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
