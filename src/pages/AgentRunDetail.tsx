import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ContextVisualization from '../components/agent/ContextVisualization'
import { getAgentRun, type AgentRunDetail } from '../api/agents'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Clock, ArrowLeft, FileText, Activity, Database, Calendar } from 'lucide-react'

export default function AgentRunDetail() {
  const { id } = useParams()
  const [detail, setDetail] = useState<AgentRunDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setError(null)
      setLoading(true)
      try {
        const res = await getAgentRun(id as string)
        if ((res as any).success === false) setError((res as any).error?.message || 'Run yüklenemedi')
        else setDetail(((res as any).data || res) as AgentRunDetail)
      } catch (e: any) {
        setError(e?.message || 'Run yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  // Extract total tokens if available in metadata
  const totalTokens = detail?.artifacts
    ?.find((a) => a.meta?.contextEngineer)
    ?.meta?.contextEngineer?.metadata?.totalTokens

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded': return <Badge variant="success" size="md" icon={CheckCircle}>Başarılı</Badge>
      case 'failed': return <Badge variant="error" size="md" icon={XCircle}>Hata</Badge>
      case 'running': return <Badge variant="info" size="md" icon={Loader2} pulse>Çalışıyor</Badge>
      default: return <Badge variant="default" size="md" icon={Clock}>Bekliyor</Badge>
    }
  }

  return (
    <DashboardLayout title="Agent Run Detayı">
      {loading && (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {detail && (
        <div className="space-y-8">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/agents">
              <Button variant="ghost" size="sm" icon={ArrowLeft}>
                Geri
              </Button>
            </Link>
          </div>

          <Card hover={false} variant="gradient-border" className="!p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <div className="text-sm text-premium-muted mb-2 font-medium uppercase tracking-wider">Agent Görevi</div>
                <div className="text-3xl font-bold text-white capitalize tracking-tight">{detail.run.agentName.replace('_', ' ')}</div>
              </div>
              <div>
                {getStatusBadge(detail.run.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/10">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-premium-muted text-sm mb-1 font-medium">Run ID</div>
                  <div className="text-gray-200 font-mono text-sm bg-black/20 px-2 py-1 rounded border border-white/5">{detail.run.id}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-premium-muted text-sm mb-1 font-medium">Proje</div>
                  {detail.run.projectId ? (
                    <Link to={`/projects/${detail.run.projectId}`} className="text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline">
                      {detail.run.projectId}
                    </Link>
                  ) : (
                    <div className="text-gray-500">-</div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-premium-muted text-sm mb-1 font-medium">Oluşturma Tarihi</div>
                  <div className="text-gray-200 font-mono text-sm">{new Date(detail.run.createdAt).toLocaleString('tr-TR')}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Context Visualization */}
          {detail.contextUsages && detail.contextUsages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                Context Kullanımı
              </h3>
              <ContextVisualization
                contextUsages={detail.contextUsages}
                totalTokens={totalTokens}
              />
            </motion.div>
          )}

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Artifacts
            </h3>

            {detail.artifacts.length === 0 && (
              <div className="text-center py-12 glass-panel rounded-2xl border-dashed border-2 border-glass-border/50">
                <p className="text-gray-400">Bu işlem için henüz çıktı üretilmedi.</p>
              </div>
            )}

            {detail.artifacts.map((a, index) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <Card variant="elevated" className="overflow-hidden">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wide border border-blue-500/20">
                        {a.type}
                      </div>
                      <h4 className="text-lg font-semibold text-white">{a.title}</h4>
                    </div>
                  </div>

                  <div className="prose prose-invert max-w-none text-gray-300 prose-headings:text-white prose-a:text-blue-400 prose-code:text-pink-400 prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10 prose-strong:text-white">
                    <ReactMarkdown>{a.content}</ReactMarkdown>
                  </div>

                  {a.meta?.usage && (
                    <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/10 -mx-6 -mb-6 p-6">
                      <div>
                        <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-medium">Input Tokens</div>
                        <div className="text-white font-mono font-semibold">{a.meta.usage.inputTokens ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-medium">Output Tokens</div>
                        <div className="text-white font-mono font-semibold">{a.meta.usage.outputTokens ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-medium">Total Tokens</div>
                        <div className="text-white font-mono font-semibold text-indigo-400">{a.meta.usage.totalTokens ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-medium">Latency</div>
                        <div className="text-white font-mono font-semibold">{a.meta.usage.latencyMs ? `${a.meta.usage.latencyMs} ms` : '-'}</div>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}