import { InputHTMLAttributes, useState } from 'react';
import { ReactNode } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  success?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  showClear?: boolean;
  onClear?: () => void;
  helperText?: string;
};

export default function Input({
  label,
  error,
  success = false,
  icon,
  disabled = false,
  prefix,
  suffix,
  showClear = false,
  onClear,
  helperText,
  className = '',
  value,
  maxLength,
  ...props
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== '';

  return (
    <div className="space-y-1">
      {label && (
        <label className={clsx(
          'block text-sm font-medium transition-colors duration-200',
          error ? 'text-semantic-error' : success ? 'text-semantic-success' : 'text-gray-300'
        )}>
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className={clsx(
            'absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200',
            error ? 'text-semantic-error' : success ? 'text-semantic-success' : 'text-gray-400 group-hover:text-gray-300'
          )}>
            {icon}
          </div>
        )}
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
            {prefix}
          </div>
        )}
        <input
          disabled={disabled}
          value={value}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={clsx(
            'w-full px-3 py-2.5 bg-black/20 border rounded-xl text-gray-100 placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-premium-bg',
            'transition-all duration-200 hover:border-gray-600',
            'disabled:opacity-50 disabled:pointer-events-none',
            icon && 'pl-10',
            prefix && 'pl-8',
            (suffix || showClear || success || error) && 'pr-10',
            error
              ? 'border-semantic-error/50 focus:border-semantic-error focus:ring-semantic-error/20'
              : success
                ? 'border-semantic-success/50 focus:border-semantic-success focus:ring-semantic-success/20'
                : 'border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20',
            isFocused && !error && !success && 'shadow-glow-sm',
            className
          )}
          {...props}
        />
        {suffix && !showClear && !success && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
            {suffix}
          </div>
        )}
        {showClear && hasValue && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {success && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-semantic-success">
            <Check className="w-4 h-4" />
          </div>
        )}
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-semantic-error">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          {error && <p className="text-sm text-semantic-error flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
          {!error && helperText && <p className="text-sm text-gray-500">{helperText}</p>}
        </div>
        {maxLength && (
          <p className="text-xs text-gray-500">
            {String(value || '').length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}