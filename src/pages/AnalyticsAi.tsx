import { useEffect, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import Select from '../components/ui/Select'
import { getUserAiUsageSummary, type UserAiUsageSummary } from '../api/telemetry'

export default function AnalyticsAi() {
  const [days, setDays] = useState(30)
  const [summary, setSummary] = useState<UserAiUsageSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await getUserAiUsageSummary(days)
      const data = (res as any).data || res
      setSummary(data as UserAiUsageSummary)
    } catch (e: any) {
      setError(e?.message || 'Analitik yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [days])

  return (
    <DashboardLayout title="AI Kullanım Analitiği">
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Özet</div>
            <div className="w-40">
              <Select value={String(days)} onChange={(e) => setDays(Number(e.target.value))}>
                <option value="7">Son 7 gün</option>
                <option value="30">Son 30 gün</option>
                <option value="90">Son 90 gün</option>
              </Select>
            </div>
          </div>
          {loading && <Spinner />}
          {error && <Alert variant="error">{error}</Alert>}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <div className="text-sm text-gray-500">Toplam Çağrı</div>
                <div className="text-2xl font-semibold">{summary.totalCalls}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500">Toplam Token</div>
                <div className="text-2xl font-semibold">{summary.totalTokens}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500">Ort. Gecikme</div>
                <div className="text-2xl font-semibold">{summary.avgLatencyMs ?? '-'}</div>
              </Card>
            </div>
          )}
        </Card>

        {summary && (
          <Card>
            <div className="text-lg font-semibold mb-4">Projeye Göre Kullanım</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="px-2 py-1">Proje</th>
                    <th className="px-2 py-1">Çağrı</th>
                    <th className="px-2 py-1">Token</th>
                    <th className="px-2 py-1">Ort. Gecikme</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byProject.map((p) => (
                    <tr key={p.projectId} className="border-t">
                      <td className="px-2 py-1">{p.projectId}</td>
                      <td className="px-2 py-1">{p.totalCalls}</td>
                      <td className="px-2 py-1">{p.totalTokens}</td>
                      <td className="px-2 py-1">{p.avgLatencyMs ?? '-'}</td>
                    </tr>
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