import { ReactNode } from 'react'

type Props = { label?: string; error?: string; children: ReactNode }

export default function FormField({ label, error, children }: Props) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}