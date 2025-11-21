import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
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
  Workflow,
  FileText,
  Eye,
  Building2,
  Globe,
  Smartphone,
  Video,
  Layers,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { Project } from '../../shared/types'
import { Toaster, toast } from 'sonner'

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { projects, setProjects, setCurrentProject } = useStore()
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
      <Toaster position="top-right" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover={false} className="!p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Tüm Projeler</h2>
          <p className="text-gray-400 text-sm">Çalışmalarınızı yönetin ve geliştirin</p>
        </div>
        <Button onClick={() => setShowNewProjectModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Yeni Proje
        </Button>
      </div>

      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 glass-panel rounded-2xl border-dashed"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Folder className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">Henüz projeniz yok</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">İlk projenizi oluşturarak harika işlere başlayın</p>
          <Button onClick={() => setShowNewProjectModal(true)} className="mx-auto">
            <Plus className="w-4 h-4 mr-2" />
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
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 mr-3">
                      {getProjectIcon(project.project_type)}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                  {project.description || 'Açıklama yok'}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-5 pb-5 border-b border-gray-700/50">
                  <span className="flex items-center text-gray-400">
                    <span className="font-medium">{project.sector}</span>
                  </span>
                  <span className="text-gray-500">{new Date(project.created_at).toLocaleDateString('tr-TR')}</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 transition-all"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    Detay
                  </Link>
                  <Link
                    to={`/wizard/app?project=${project.id}`}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/25"
                  >
                    <Wand2 className="w-4 h-4 mr-1.5" />
                    Wizard
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Yeni Proje Oluştur</h2>

              <div className="space-y-4">
                <Input
                  label="Proje Adı"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Örn: E-Ticaret Platformu"
                  icon={<Folder className="w-4 h-4" />}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:border-gray-600 resize-none"
                    rows={3}
                    placeholder="Proje hakkında kısa bir açıklama yazın..."
                  />
                </div>

                <Select
                  label="Sektör"
                  value={newProject.sector}
                  onChange={(e) => setNewProject({ ...newProject, sector: e.target.value })}
                >
                  <option value="">Sektör seçin</option>
                  {(sectors.length > 0 ? sectors : defaultSectors).map((sector) => (
                    <option key={sector.sector_code} value={sector.sector_code}>
                      {sector.name}
                    </option>
                  ))}
                </Select>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Proje Türü
                  </label>
                  <select
                    value={newProject.projectType}
                    onChange={(e) => setNewProject({ ...newProject, projectType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:border-gray-600 cursor-pointer"
                  >
                    <option value="saas">SaaS Platform</option>
                    <option value="web_app">Web Uygulaması</option>
                    <option value="mobile_app">Mobil Uygulama</option>
                    <option value="media">Medya Platformu</option>
                    <option value="hybrid">Hibrit Çözüm</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowNewProjectModal(false)} className="flex-1 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700">
                  İptal
                </Button>
                <Button onClick={handleCreateProject} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25">
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