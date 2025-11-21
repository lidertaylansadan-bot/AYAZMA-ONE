import { motion } from 'framer-motion'
import { ReactNode } from 'react'

type Props = { children: ReactNode; className?: string; hover?: boolean }

export default function Card({ children, className = '', hover = true }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={hover ? { scale: 1.02, y: -4 } : {}}
      className={`glass-panel rounded-xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  )
}