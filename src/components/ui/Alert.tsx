import { ReactNode } from 'react'

type Props = { children: ReactNode; variant?: 'info' | 'error' | 'success' }

export default function Alert({ children, variant = 'info' }: Props) {
  const styles: Record<string, string> = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-green-50 text-green-700 border-green-200',
  }
  return <div className={`border rounded-md px-4 py-3 ${styles[variant]}`}>{children}</div>
}