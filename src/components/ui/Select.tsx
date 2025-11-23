import { SelectHTMLAttributes, ReactNode } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; placeholder?: string; children: ReactNode }

export default function Select({ label, error, placeholder, className = '', children, ...props }: Props) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <select
        className={`w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 transition-all duration-200 hover:border-gray-600 cursor-pointer ${className}`}
        {...props}
      >
        {placeholder && <option value="" disabled selected>{placeholder}</option>}
        {children}
      </select>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}