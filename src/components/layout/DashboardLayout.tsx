import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Settings, LogOut, User, Bot, BarChart3 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { motion } from 'framer-motion'

type Props = { children: ReactNode; title?: string }

export default function DashboardLayout({ children, title }: Props) {
  const { signOut } = useAuth()
  const location = useLocation()
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projelerim', href: '/projects', icon: FolderOpen },
    { name: 'AI Playground', href: '/ai', icon: Bot },
    { name: 'Agents', href: '/agents', icon: Bot },
import { ReactNode } from 'react'
  import { Link, useLocation } from 'react-router-dom'
  import { LayoutDashboard, FolderOpen, Settings, LogOut, User, Bot, BarChart3 } from 'lucide-react'
  import { useAuth } from '../../hooks/useAuth'
  import { motion } from 'framer-motion'

  type Props = { children: ReactNode; title?: string }

  export default function DashboardLayout({ children, title }: Props) {
    const { signOut } = useAuth()
    const location = useLocation()
    const navigation = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projelerim', href: '/projects', icon: FolderOpen },
      { name: 'AI Playground', href: '/ai', icon: Bot },
      { name: 'Agents', href: '/agents', icon: Bot },
      { name: 'Analytics', href: '/analytics/ai', icon: BarChart3 },
      { name: 'Ayarlar', href: '/settings', icon: Settings },
    ]
    const isActive = (path: string) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))

    return (
      <div className="flex h-screen bg-premium-bg text-premium-text">
        <aside className="flex flex-col w-64 m-4 glass-panel rounded-2xl overflow-hidden border-glass-border">
          <div className="flex items-center justify-center h-20 bg-primary-gradient backdrop-blur-md px-4 shadow-lg">
            <img src="/src/assets/logo.png" alt="Ayazma ONE" className="h-8 w-auto mr-3 brightness-0 invert" />
            <h1 className="text-xl font-bold text-white tracking-wide">Ayazma ONE</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${active ? 'text-white shadow-md' : 'text-premium-muted hover:bg-glass-hover hover:text-white'
                    }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary-gradient rounded-xl shadow-lg shadow-blue-500/20"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center">
                    <Icon className={`w-5 h-5 mr-3 ${active ? 'text-white' : ''}`} />
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-glass-border">
            <button
              onClick={() => signOut()}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-premium-muted rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Çıkış Yap
            </button>
          </div>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between h-20 px-8 m-4 mb-0 glass-panel rounded-2xl border-glass-border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/20 rounded-full mr-3">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-premium-text">Hoş geldiniz</span>
            </div>
            <div className="text-sm font-medium text-premium-muted bg-glass-hover px-3 py-1 rounded-full border border-glass-border">Core Panel v1</div>
          </header>
          <main className="flex-1 overflow-y-auto p-4">
            <div className="px-4 pb-8 space-y-6">
              {title && (
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold premium-gradient-text"
                >
                  {title}
                </motion.h2>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }