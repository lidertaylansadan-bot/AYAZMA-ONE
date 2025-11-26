import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { NotificationCenter } from './notifications/NotificationCenter'
import { UserMenu } from './layout/UserMenu'
import { Breadcrumbs } from './layout/Breadcrumbs'
import { CommandPalette } from './layout/CommandPalette'
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  LogOut,
  Wand2,
  FileText,
  Workflow,
  Activity,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { signOut } = useAuth()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projelerim', href: '/projects', icon: FolderOpen },
    { name: 'Control Panel', href: '/control-panel', icon: Activity },
    { name: 'Audit Log', href: '/audit-log', icon: FileText },
    { name: 'App Wizard', href: '/wizard/app', icon: Wand2 },
    { name: 'Workflow Wizard', href: '/wizard/workflow', icon: Workflow },
    { name: 'Content Wizard', href: '/wizard/content', icon: FileText },
    { name: 'Ayarlar', href: '/settings', icon: Settings },
  ]

  const isActive = (path: string) => {
    return location.pathname === path ||
      (path !== '/dashboard' && location.pathname.startsWith(path))
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar - Desktop */}
      <motion.div
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        className="hidden lg:flex flex-col bg-white border-r border-gray-200 relative"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors z-10"
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-6 bg-blue-600">
          <motion.h1
            initial={false}
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            className="text-xl font-bold text-white whitespace-nowrap"
          >
            {isSidebarOpen ? 'Ayazma ONE' : 'A1'}
          </motion.h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center ${isSidebarOpen ? 'px-4' : 'px-0 justify-center'} py-3 text-sm font-medium rounded-lg transition-all ${isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="ml-3">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => signOut()}
            className={`flex items-center w-full ${isSidebarOpen ? 'px-4' : 'px-0 justify-center'} py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors`}
            title={!isSidebarOpen ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="ml-3">Çıkış Yap</span>}
          </button>
        </div>
      </motion.div>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 flex flex-col"
            >
              <div className="flex items-center justify-center h-16 px-6 bg-blue-600">
                <h1 className="text-xl font-bold text-white">Ayazma ONE</h1>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(item.href)
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    signOut()
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Çıkış Yap
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
          <Breadcrumbs />
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <UserMenu />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  )
}