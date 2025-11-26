import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Button from '../components/ui/Button'
import { GradientButton } from '../components/ui/GradientButton'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import SearchInput from '../components/ui/SearchInput'
import MultiSelect from '../components/ui/MultiSelect'
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
  CheckCircle2,
  Sparkles,
  Zap,
  LayoutDashboard,
  ArrowRight,
  Filter
} from 'lucide-react'
import { Toaster, toast } from 'sonner'

export default function Projects() {
  const { projects, setProjects } = useStore()
  const [loading, setLoading] = useState(true)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    sector: '',
    projectType: 'saas'
  })

  const [sectors, setSectors] = useState<Array<{ sector_code: string, name: string }>>([])
  const defaultSectors: Array<{ sector_code: string, name: string }> = [
    { sector_code: 'saas', name: 'SaaS' },
    { sector_code: 'agency', name: 'Agency' },
    { sector_code: 'ecommerce', name: 'E-commerce' },
    { sector_code: 'hotel', name: 'Hotel' },
    { sector_code: 'legaltech', name: 'Legal Tech' },
  ]

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'live', label: 'Live' },
    { value: 'archived', label: 'Archived' }
  ]

  useEffect(() => {
    loadProjects()
    loadSectors()
  }, [])

  const loadProjects = async () => {
    try {
      const result = await getProjects()
      if (result.success && result.data) setProjects(result.data)
    } catch (error) {
      toast.error('Failed to load projects')
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
      toast.error('Please fill in all fields')
      return
    }

    try {
      const result = await createProject(newProject)

      if (result.success && result.data) {
        setProjects([result.data, ...projects])
        setShowNewProjectModal(false)
        setNewProject({ name: '', description: '', sector: '', projectType: 'saas' })
        toast.success('Project created successfully')
      } else {
        toast.error(result.error?.message || 'Failed to create project')
      }
    } catch (error) {
      toast.error('Failed to create project')
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.sector.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSector = selectedSectors.length === 0 || selectedSectors.includes(project.sector)
    const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(project.status)

    return matchesSearch && matchesSector && matchesStatus
  })

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: Folder, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Agents', value: projects.reduce((acc, p) => acc + (p.status === 'live' ? 1 : 0), 0), icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Completed Tasks', value: 128, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F172A]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <DashboardLayout>
      <Toaster position="top-right" theme="dark" />

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20">
              <LayoutDashboard className="w-8 h-8 text-indigo-400" />
            </div>
            Projects
          </h1>
          <p className="text-gray-400">Manage your projects and agents</p>
        </div>
        <GradientButton
          onClick={() => setShowNewProjectModal(true)}
          icon={Plus}
        >
          New Project
        </GradientButton>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-gray-400 font-medium">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Projects Section */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">All Projects</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className={`text-gray-400 hover:text-white ${showFilters ? 'bg-white/10 text-white' : ''}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {(selectedSectors.length > 0 || selectedStatus.length > 0) && (
                  <Badge variant="default" className="ml-2 bg-indigo-500 text-white border-none">
                    {selectedSectors.length + selectedStatus.length}
                  </Badge>
                )}
              </Button>
              <div className="w-64">
                <SearchInput
                  onSearch={setSearchQuery}
                  placeholder="Search projects..."
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MultiSelect
                    label="Filter by Sector"
                    options={sectors.map(s => ({ value: s.sector_code, label: s.name }))}
                    value={selectedSectors}
                    onChange={setSelectedSectors}
                    placeholder="Select sectors..."
                  />
                  <MultiSelect
                    label="Filter by Status"
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    placeholder="Select status..."
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-white/5">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Folder className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No projects found</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {searchQuery || selectedSectors.length > 0 || selectedStatus.length > 0
                ? 'Try adjusting your search terms or filters.'
                : 'Get started by creating your first project to unleash the power of AI agents.'}
            </p>
            {!searchQuery && selectedSectors.length === 0 && selectedStatus.length === 0 && (
              <GradientButton onClick={() => setShowNewProjectModal(true)} icon={Plus}>
                Create Project
              </GradientButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-white/5 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                    {getProjectIcon(project.project_type)}
                  </div>
                  <Badge variant={project.status === 'live' ? 'success' : 'default'} className="uppercase text-[10px] tracking-wider">
                    {project.status}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-400 mb-6 line-clamp-2 min-h-[40px]">
                  {project.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    {project.sector}
                  </span>
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors group/link"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Create New Project</h2>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                <Input
                  label="Project Name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g. AI Content Generator"
                  className="bg-black/20 border-white/10 focus:border-indigo-500/50"
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Sector</label>
                  <Select
                    value={newProject.sector}
                    onChange={(e) => setNewProject({ ...newProject, sector: e.target.value })}
                    options={sectors.map(s => ({ value: s.sector_code, label: s.name }))}
                    className="bg-black/20 border-white/10 focus:border-indigo-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Project Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['saas', 'web_app', 'mobile_app', 'agency'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewProject({ ...newProject, projectType: type })}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${newProject.projectType === type
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                      >
                        {type.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Brief description of your project..."
                  className="bg-black/20 border-white/10 focus:border-indigo-500/50"
                />
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/20">
                <Button
                  variant="ghost"
                  onClick={() => setShowNewProjectModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <GradientButton onClick={handleCreateProject}>
                  Create Project
                </GradientButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}