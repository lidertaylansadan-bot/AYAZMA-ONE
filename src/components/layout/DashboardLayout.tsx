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
    <div className="flex h-screen bg-premium-bg text-premium-text overflow-hidden">
      <aside className="flex flex-col w-72 m-4 glass-panel rounded-3xl overflow-hidden border-glass-border relative z-20">
        <div className="flex items-center justify-center h-24 bg-glass-gradient backdrop-blur-md px-6 border-b border-glass-border">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center">
              <img src="/src/assets/logo.png" alt="Ayazma ONE" className="h-10 w-auto mr-3 brightness-0 invert" />
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200 tracking-tight">Ayazma</h1>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`relative flex items-center px-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-300 group ${active ? 'text-white shadow-lg shadow-indigo-500/20' : 'text-premium-muted hover:bg-glass-hover hover:text-white'
                  }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center w-full">
                  <Icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${active ? 'text-white scale-110' : 'group-hover:scale-110'}`} />
                  {item.name}
                  {active && <motion.div layoutId="glow" className="absolute right-0 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />}
                </span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-glass-border bg-glass-gradient">
          <button
            onClick={() => signOut()}
            className="flex items-center w-full px-4 py-3.5 text-sm font-medium text-premium-muted rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
            Çıkış Yap
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="flex items-center justify-between h-20 px-8 m-4 mb-0 glass-panel rounded-3xl border-glass-border">
          <div className="flex items-center gap-4">
            <div className="p-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500">
              <div className="p-2 bg-premium-card rounded-full">
                <User className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="block text-sm font-medium text-premium-text">Hoş geldiniz</span>
              <span className="text-xs text-premium-muted">Admin Paneli</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs font-medium text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Core Panel v1.0
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 scrollbar-hide">
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