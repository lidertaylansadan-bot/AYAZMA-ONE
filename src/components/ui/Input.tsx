import { InputHTMLAttributes } from 'react';
import { ReactNode } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export default function Input({
  label,
  error,
  icon,
  disabled = false,
  className = '',
  ...props
}: Props) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          disabled={disabled}
          className={`w-full ${icon ? 'pl-10' : ''} px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 transition-all duration-200 hover:border-gray-600 disabled:opacity-50 disabled:pointer-events-none ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}