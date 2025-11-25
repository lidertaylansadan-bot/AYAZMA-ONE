import { useEffect, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import { listAgentRuns, startAgentRun, type AgentRunSummary, type AgentName } from '../api/agents'
import { useStore } from '../store/useStore'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Clock, CheckCircle, XCircle, Loader2, Eye, Bot, Sparkles, LayoutGrid } from 'lucide-react'

export default function AgentsList() {
  const { projects } = useStore()
  const [runs, setRuns] = useState<AgentRunSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState<string>('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AgentName>('orchestrator')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [starting, setStarting] = useState(false)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await listAgentRuns(projectFilter || undefined)
      if ((res as any).success === false) setError((res as any).error?.message || 'Agent runs yüklenemedi')
      else setRuns(((res as any).data || res) as AgentRunSummary[])
    } catch (e: any) {
      setError(e?.message || 'Agent runs yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [projectFilter])

  const handleStartRun = async () => {
    if (!selectedProject) {
      setError('Lütfen bir proje seçin')
      return
    }
    setStarting(true)
    setError(null)
    try {
      const res = await startAgentRun({ agentName: selectedAgent, projectId: selectedProject })
      if ((res as any).success === false) setError((res as any).error?.message || 'Agent başlatılamadı')
      else {
        setIsModalOpen(false)
        load()
      }
    } catch (e: any) {
      setError(e?.message || 'Agent başlatılamadı')
    } finally {
      setStarting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded': return <Badge variant="success" size="sm" icon={CheckCircle}>Başarılı</Badge>
      case 'failed': return <Badge variant="error" size="sm" icon={XCircle}>Hata</Badge>
      case 'running': return <Badge variant="info" size="sm" icon={Loader2} pulse>Çalışıyor</Badge>
      default: return <Badge variant="default" size="sm" icon={Clock}>Bekliyor</Badge>
    }
  }

  return (
    <DashboardLayout title="Agent Manager">
      <div className="space-y-6">
        <Card className="!p-4" variant="gradient-border">
          <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
            <div className="w-full md:w-1/3">
              <Select
                label="Proje Filtresi"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="bg-black/20 border-white/10"
              >
                <option value="">Tümü</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full md:w-auto"
                variant="glow"
                icon={Play}
              >
                Yeni Agent Çalıştır
              </Button>
            </div>
          </div>
        </Card>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setIsModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg glass-panel rounded-3xl shadow-2xl overflow-hidden border border-white/10"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                <div className="px-8 py-6 border-b border-white/5 bg-white/5">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Yeni Agent Çalıştır
                  </h3>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Agent Seçin</label>
                    <div className="grid grid-cols-1 gap-3">
                      {['orchestrator', 'design_spec', 'workflow_designer', 'content_strategist'].map((agent) => (
                        <div
                          key={agent}
                          onClick={() => setSelectedAgent(agent as AgentName)}
                          className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group ${selectedAgent === agent
                            ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50'
                            : 'border-white/10 bg-black/20 hover:border-blue-400/50 hover:bg-white/5'
                            }`}
                        >
                          <div className="flex items-center justify-between relative z-10">
                            <div>
                              <div className="font-semibold text-gray-200 capitalize flex items-center gap-2">
                                {agent === 'orchestrator' ? <LayoutGrid className="w-4 h-4 text-purple-400" /> : <Bot className="w-4 h-4 text-blue-400" />}
                                {agent.replace('_', ' ')}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {agent === 'orchestrator' ? 'Tüm ajanları sırasıyla çalıştırır.' : 'Tekil görev ajanı.'}
                              </div>
                            </div>
                            {selectedAgent === agent && (
                              <motion.div layoutId="check" className="text-blue-400">
                                <CheckCircle className="w-5 h-5" />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Select
                    label="Proje Seçin"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="bg-black/20 border-white/10"
                  >
                    <option value="">Seçiniz...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </div>

                <div className="px-8 py-6 bg-black/20 border-t border-white/5 flex justify-end space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-300 hover:text-white hover:bg-white/5"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleStartRun}
                    disabled={starting}
                    loading={starting}
                    variant="glow"
                    icon={Play}
                  >
                    Çalıştır
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        {!loading && runs.length === 0 && (
          <div className="text-center py-24 glass-panel rounded-3xl border-dashed border-2 border-glass-border/50">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Bot className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Henüz işlem yok</h3>
            <p className="text-gray-400 mb-6">Henüz hiç agent çalıştırılmamış.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="secondary">
              İlk Agenti Çalıştır
            </Button>
          </div>
        )}

        {runs.length > 0 && (
          <Card className="overflow-hidden !p-0" variant="elevated">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-black/20 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-medium">Agent</th>
                    <th className="px-6 py-4 font-medium">Proje</th>
                    <th className="px-6 py-4 font-medium">Durum</th>
                    <th className="px-6 py-4 font-medium">Tarih</th>
                    <th className="px-6 py-4 font-medium text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {runs.map((r) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-transparent hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-gray-200 capitalize flex items-center gap-2">
                        <Bot className="w-4 h-4 text-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                        {r.agentName.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{projects.find((p) => p.id === r.projectId)?.name || '-'}</td>
                      <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{new Date(r.createdAt).toLocaleString('tr-TR')}</td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/agents/runs/${r.id}`}>
                          <Button variant="ghost" size="sm" icon={Eye} className="text-gray-400 hover:text-white">

                          </Button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}