import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import { getAgentRun, type AgentRunDetail } from '../api/agents'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'

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

  return (
    <DashboardLayout title="Agent Run">
      {loading && <Spinner />}
      {error && <Alert variant="error">{error}</Alert>}
      {detail && (
        <div className="space-y-6">
          <Card hover={false}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">Agent</div>
                <div className="text-2xl font-bold text-white capitalize">{detail.run.agentName.replace('_', ' ')}</div>
              </div>
              <div>
                <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-gray-800/50 text-gray-300 border border-gray-700">{detail.run.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-700/50">
              <div>
                <div className="text-gray-400 text-sm mb-1">Run ID</div>
                <div className="text-gray-200 font-mono text-sm">{detail.run.id}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Proje</div>
                {detail.run.projectId ? (
                  <Link to={`/projects/${detail.run.projectId}`} className="text-blue-400 hover:text-blue-300 transition-colors font-medium">{detail.run.projectId}</Link>
                ) : (
                  <div className="text-gray-500">-</div>
                )}
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Oluşturma</div>
                <div className="text-gray-200">{new Date(detail.run.createdAt).toLocaleString('tr-TR')}</div>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Artifacts</h3>
            {detail.artifacts.map((a, index) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wide">
                        {a.type}
                      </div>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-4">{a.title}</h4>
                  <div className="prose prose-invert max-w-none text-gray-300 prose-headings:text-white prose-a:text-blue-400 prose-code:text-pink-400 prose-pre:bg-gray-900/50 prose-pre:border prose-pre:border-gray-700">
                    <ReactMarkdown>{a.content}</ReactMarkdown>
                  </div>
                  {a.meta?.usage && (
                    <div className="mt-6 pt-6 border-t border-gray-700/50 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Input Tokens</div>
                        <div className="text-white font-semibold">{a.meta.usage.inputTokens ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Output Tokens</div>
                        <div className="text-white font-semibold">{a.meta.usage.outputTokens ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Total Tokens</div>
                        <div className="text-white font-semibold">{a.meta.usage.totalTokens ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Latency</div>
                        <div className="text-white font-semibold">{a.meta.usage.latencyMs ? `${a.meta.usage.latencyMs} ms` : '-'}</div>
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