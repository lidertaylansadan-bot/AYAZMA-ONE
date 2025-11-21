import { useEffect, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import { listAgentRuns, startAgentRun, type AgentRunSummary, type AgentName } from '../api/agents'
import { useStore } from '../store/useStore'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Clock, CheckCircle, XCircle, Loader2, Eye, Bot } from 'lucide-react'

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
      case 'succeeded': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Başarılı</span>
      case 'failed': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Hata</span>
      case 'running': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Çalışıyor</span>
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" /> Bekliyor</span>
    }
  }

  return (
    <DashboardLayout title="Agent Manager">
      <div className="space-y-6">
        <Card className="!p-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
            <div className="w-full md:w-1/3">
              <Select label="Proje Filtresi" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                <option value="">Tümü</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto">
                <Play className="w-4 h-4 mr-2" /> Yeni Agent Çalıştır
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
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={() => setIsModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-700/50 bg-gray-800/50">
                  <h3 className="text-lg font-semibold text-white">Yeni Agent Çalıştır</h3>
                </div>

                <div className="p-6 space-y-6 bg-gray-900">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Agent Seçin</label>
                    <div className="grid grid-cols-1 gap-3">
                      {['orchestrator', 'design_spec', 'workflow_designer', 'content_strategist'].map((agent) => (
                        <div
                          key={agent}
                          onClick={() => setSelectedAgent(agent as AgentName)}
                          className={`cursor-pointer p-3 rounded-xl border transition-all ${selectedAgent === agent
                              ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                              : 'border-gray-700 hover:border-blue-400 hover:bg-gray-800'
                            }`}
                        >
                          <div className="font-medium text-gray-200 capitalize">{agent.replace('_', ' ')}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {agent === 'orchestrator' ? 'Tüm ajanları sırasıyla çalıştırır.' : 'Tekil görev ajanı.'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Select label="Proje Seçin" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                    <option value="">Seçiniz...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </div>

                <div className="px-6 py-4 bg-gray-800 flex justify-end space-x-3">
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white hover:bg-gray-700">İptal</Button>
                  <Button onClick={handleStartRun} disabled={starting}>
                    {starting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Başlatılıyor</> : 'Çalıştır'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {loading && <div className="flex justify-center py-12"><Spinner /></div>}
        {error && <Alert variant="error">{error}</Alert>}
        {!loading && runs.length === 0 && (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-gray-700">
            <Bot className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">Henüz hiç agent çalıştırılmamış.</p>
          </div>
        )}

        {runs.length > 0 && (
          <Card className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-medium">Agent</th>
                    <th className="px-6 py-4 font-medium">Proje</th>
                    <th className="px-6 py-4 font-medium">Durum</th>
                    <th className="px-6 py-4 font-medium">Tarih</th>
                    <th className="px-6 py-4 font-medium text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {runs.map((r) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-transparent hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-200 capitalize">{r.agentName.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-gray-400">{projects.find((p) => p.id === r.projectId)?.name || '-'}</td>
                      <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(r.createdAt).toLocaleString('tr-TR')}</td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/agents/runs/${r.id}`}>
                          <Button variant="ghost" className="!p-2 h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-gray-700">
                            <Eye className="w-4 h-4" />
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