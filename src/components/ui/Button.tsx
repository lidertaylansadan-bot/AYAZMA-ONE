import { ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
};

export default function Button({
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}: Props) {
  const base =
    'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none';
  const styles: Record<string, string> = {
    primary:
      'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30 border border-transparent',
    secondary:
      'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 border border-gray-200 hover:shadow-md',
    danger:
      'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg hover:shadow-red-500/30',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100/50',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${base} ${styles[variant]} ${className}`}
      disabled={disabled}
      {...(props as any)}
    />
  );
}