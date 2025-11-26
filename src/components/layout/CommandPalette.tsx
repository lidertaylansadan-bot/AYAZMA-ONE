/**
 * Command Palette Component
 * Quick navigation and actions (Cmd+K / Ctrl+K)
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Command, ArrowRight } from 'lucide-react'
import * as Icons from 'lucide-react'

interface CommandItem {
    id: string
    label: string
    description?: string
    icon: keyof typeof Icons
    action: () => void
    category: string
}

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const navigate = useNavigate()
    const inputRef = useRef<HTMLInputElement>(null)

    const commands: CommandItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            description: 'Go to dashboard',
            icon: 'LayoutDashboard',
            action: () => navigate('/dashboard'),
            category: 'Navigation'
        },
        {
            id: 'projects',
            label: 'Projects',
            description: 'View all projects',
            icon: 'FolderOpen',
            action: () => navigate('/projects'),
            category: 'Navigation'
        },
        {
            id: 'control-panel',
            label: 'Control Panel',
            description: 'Monitor agent activity',
            icon: 'Activity',
            action: () => navigate('/control-panel'),
            category: 'Navigation'
        },
        {
            id: 'audit-log',
            label: 'Audit Log',
            description: 'View activity logs',
            icon: 'FileText',
            action: () => navigate('/audit-log'),
            category: 'Navigation'
        },
        {
            id: 'new-project',
            label: 'New Project',
            description: 'Create a new project',
            icon: 'Plus',
            action: () => navigate('/dashboard'),
            category: 'Actions'
        },
        {
            id: 'settings',
            label: 'Settings',
            description: 'Configure your account',
            icon: 'Settings',
            action: () => navigate('/settings'),
            category: 'Navigation'
        }
    ]

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(search.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(search.toLowerCase())
    )

    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = []
        acc[cmd.category].push(cmd)
        return acc
    }, {} as Record<string, CommandItem[]>)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
            if (e.key === 'Escape') {
                setIsOpen(false)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    const handleSelect = (command: CommandItem) => {
        command.action()
        setIsOpen(false)
        setSearch('')
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Command Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Type a command or search..."
                                className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                            />
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs text-gray-400">
                                <Command className="w-3 h-3" />
                                <span>K</span>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-96 overflow-y-auto">
                            {Object.keys(groupedCommands).length === 0 ? (
                                <div className="py-12 text-center text-gray-400">
                                    No results found
                                </div>
                            ) : (
                                Object.entries(groupedCommands).map(([category, items]) => (
                                    <div key={category} className="py-2">
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {category}
                                        </div>
                                        {items.map((cmd) => {
                                            const Icon = Icons[cmd.icon] as React.ComponentType<{ className?: string }>
                                            return (
                                                <button
                                                    key={cmd.id}
                                                    onClick={() => handleSelect(cmd)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                                                >
                                                    <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                                    <div className="flex-1 text-left">
                                                        <div className="text-sm font-medium text-white">
                                                            {cmd.label}
                                                        </div>
                                                        {cmd.description && (
                                                            <div className="text-xs text-gray-400">
                                                                {cmd.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
                                                </button>
                                            )
                                        })}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                            <span>Navigate with ↑↓</span>
                            <span>Select with ↵</span>
                            <span>Close with ESC</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
