import { motion } from 'framer-motion'

import { ReactNode } from 'react'

type Props = { children: ReactNode; className?: string; hover?: boolean }

export default function Card({ children, className = '', hover = true }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      className={`glass-panel rounded-2xl p-6 relative overflow-hidden group ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}