import { ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { Loader2, LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'glow' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  className?: string;
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  children,
  ...props
}: Props) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden';

  const sizeStyles = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const styles: Record<string, string> = {
    primary:
      'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30 border border-transparent hover:from-blue-500 hover:to-indigo-500',
    secondary:
      'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md',
    danger:
      'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg hover:shadow-red-500/30 hover:from-red-500 hover:to-rose-500',
    success:
      'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-green-500',
    ghost:
      'bg-transparent text-gray-300 hover:bg-white/5',
    glow:
      'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-neon-purple hover:shadow-neon-blue animate-glow-pulse',
    gradient:
      'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg hover:shadow-purple-500/50',
  };

  const iconSize = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={clsx(base, sizeStyles[size], styles[variant], className)}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading && (
        <Loader2 className={clsx(iconSize[size], 'animate-spin', children && 'mr-2')} />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={clsx(iconSize[size], children && 'mr-2')} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={clsx(iconSize[size], children && 'ml-2')} />
      )}
    </motion.button>
  );
}