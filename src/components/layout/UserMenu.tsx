/**
 * User Menu Component
 * Dropdown menu for user profile and settings
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function UserMenu() {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const { user, signOut } = useAuth()

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const menuItems = [
        { label: 'Profile', icon: User, href: '/profile' },
        { label: 'Settings', icon: Settings, href: '/settings' },
    ]

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="User menu"
                aria-expanded={isOpen}
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 glass-panel rounded-xl border border-white/10 shadow-xl overflow-hidden"
                    >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-white/5">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.email || 'User'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                                {user?.email}
                            </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.label}
                                    to={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        {/* Sign Out */}
                        <div className="border-t border-white/5 py-2">
                            <button
                                onClick={() => {
                                    signOut()
                                    setIsOpen(false)
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
