import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { getProjects, createProject, apiCall } from '../api/projects'
import { useStore } from '../store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Folder,
  Wand2,
  Eye,
  Building2,
  Globe,
  Smartphone,
  Video,
  Layers,
  TrendingUp,
  CheckCircle2
} from 'lucide-react'
import { Toaster, toast } from 'sonner'

export function Dashboard() {
  const { projects, setProjects } = useStore()
  const [loading, setLoading] = useState(true)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    sector: '',
    projectType: 'saas'
  })

  const [sectors, setSectors] = useState<Array<{ sector_code: string, name: string }>>([])
  const defaultSectors: Array<{ sector_code: string, name: string }> = [
    { sector_code: 'saas', name: 'SaaS' },
    { sector_code: 'agency', name: 'Ajans' },
    { sector_code: 'ecommerce', name: 'E‑ticaret' },
    { sector_code: 'hotel', name: 'Otel' },
    { sector_code: 'legaltech', name: 'Legal Tech' },
  ]

  React.useEffect(() => {
    loadProjects()
    loadSectors()
  }, [])

  const loadProjects = async () => {
    try {
      const result = await getProjects()
      if (result.success && result.data) setProjects(result.data)
    } catch (error) {
      toast.error('Projeler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const loadSectors = async () => {
    try {
      const result = await apiCall('/sectors')
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setSectors(result.data)
      } else {
        setSectors(defaultSectors)
      }
    } catch (error) {
      setSectors(defaultSectors)
    }
  }

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.sector) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }

    try {
      const result = await createProject(newProject)

      if (result.success && result.data) {
        setProjects([result.data, ...projects])
        setShowNewProjectModal(false)
        setNewProject({ name: '', description: '', sector: '', projectType: 'saas' })
        toast.success('Proje başarıyla oluşturuldu')
      } else {
        toast.error(result.error?.message || 'Proje oluşturulurken hata oluştu')
      }
    } catch (error) {
      toast.error('Proje oluşturulurken hata oluştu')
    }
  }

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'saas': return <Building2 className="w-5 h-5" />
      case 'web_app': return <Globe className="w-5 h-5" />
      case 'mobile_app': return <Smartphone className="w-5 h-5" />
      case 'media': return <Video className="w-5 h-5" />
      case 'hybrid': return <Layers className="w-5 h-5" />
      default: return <Folder className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-700/50 text-gray-300 border border-gray-600'
      case 'building': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
      case 'live': return 'bg-green-500/20 text-green-300 border border-green-500/50'
      case 'archived': return 'bg-red-500/20 text-red-300 border border-red-500/50'
      default: return 'bg-gray-700/50 text-gray-300 border border-gray-600'
    }
  }

  const stats = [
    { label: 'Toplam Proje', value: projects.length, icon: Folder, color: 'from-blue-500 to-indigo-500' },
    { label: 'Aktif', value: projects.filter(p => p.status === 'building' || p.status === 'live').length, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
    { label: 'Tamamlanan', value: projects.filter(p => p.status === 'live').length, icon: CheckCircle2, color: 'from-purple-500 to-pink-500' },
  ]

  if (loading) return <Spinner />

  return (
    <DashboardLayout title="Projelerim">
      <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
      <Toaster position="top-right" theme="dark" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover={true} className="!p-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-premium-muted mb-1 font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold text-white tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg shadow-indigo-500/20`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Tüm Projeler</h2>
          <p className="text-premium-muted text-sm">Çalışmalarınızı yönetin ve geliştirin</p>
        </div>
        <Button onClick={() => setShowNewProjectModal(true)} className="bg-primary-gradient hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 rounded-xl px-6 py-2.5">
          <Plus className="w-5 h-5 mr-2" /> Yeni Proje
        </Button>
      </div>

      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-24 glass-panel rounded-3xl border-dashed border-2 border-glass-border/50"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
            <Folder className="w-12 h-12 text-blue-400 relative z-10" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Henüz projeniz yok</h3>
          <p className="text-premium-muted mb-8 max-w-md mx-auto text-lg">İlk projenizi oluşturarak harika işlere başlayın</p>
          <Button onClick={() => setShowNewProjectModal(true)} className="mx-auto bg-primary-gradient px-8 py-3 rounded-xl text-lg">
            <Plus className="w-5 h-5 mr-2" />
            Yeni Proje Oluştur
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full flex flex-col border-t border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-white/5 text-blue-400 mr-4">
                      {getProjectIcon(project.project_type)}
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{project.name}</h3>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(project.status)}`}>
                    {project.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-premium-muted text-sm mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
                  {project.description || 'Açıklama yok'}
                </p>

                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-6 pb-6 border-b border-white/5">
                    <span className="flex items-center text-gray-400 bg-white/5 px-3 py-1 rounded-lg">
                      <span className="font-medium text-xs uppercase tracking-wider">{project.sector}</span>
                    </span>
                    <span className="text-gray-500 font-mono text-xs">{new Date(project.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-medium bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 border border-white/5 transition-all"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detay
                    </Link>
                    <Link
                      to={`/wizard/app?project=${project.id}`}
                      className="flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Wizard
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Yeni Proje</h2>

              <div className="space-y-5">
                <Input
                  label="Proje Adı"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Örn: E-Ticaret Platformu"
                  icon={<Folder className="w-4 h-4" />}
                  className="bg-black/20 border-white/10 focus:border-indigo-500/50 rounded-xl"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                    Açıklama
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all duration-200 resize-none"
                    rows={3}
                    placeholder="Proje hakkında kısa bir açıklama yazın..."
                  />
                </div>

                <Select
                  label="Sektör"
                  value={newProject.sector}
                  onChange={(e) => setNewProject({ ...newProject, sector: e.target.value })}
                  className="bg-black/20 border-white/10 focus:border-indigo-500/50 rounded-xl"
                >
                  <option value="">Sektör seçin</option>
                  {(sectors.length > 0 ? sectors : defaultSectors).map((sector) => (
                    <option key={sector.sector_code} value={sector.sector_code}>
                      {sector.name}
                    </option>
                  ))}
                </Select>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                    Proje Türü
                  </label>
                  <div className="relative">
                    <select
                      value={newProject.projectType}
                      onChange={(e) => setNewProject({ ...newProject, projectType: e.target.value })}
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="saas">SaaS Platform</option>
                      <option value="web_app">Web Uygulaması</option>
                      <option value="mobile_app">Mobil Uygulama</option>
                      <option value="media">Medya Platformu</option>
                      <option value="hybrid">Hibrit Çözüm</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button variant="ghost" onClick={() => setShowNewProjectModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 rounded-xl py-3">
                  İptal
                </Button>
                <Button onClick={handleCreateProject} className="flex-1 bg-primary-gradient hover:shadow-lg hover:shadow-indigo-500/25 rounded-xl py-3">
                  Oluştur
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}