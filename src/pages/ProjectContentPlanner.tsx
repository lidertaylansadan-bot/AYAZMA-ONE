import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import { generateContentPlan, listContentPlans, listContentItems, updateContentItem, type ContentPlan, type ContentItem } from '../api/content'

export default function ProjectContentPlanner() {
  const { id } = useParams()
  const projectId = id as string
  const [plans, setPlans] = useState<ContentPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('next_30_days')
  const [goal, setGoal] = useState('general')
  const [channelFilter, setChannelFilter] = useState<string>('all')

  const loadPlans = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await listContentPlans(projectId)
      const data = (res as any).data || res
      setPlans(data as ContentPlan[])
    } catch (e: any) {
      setError(e?.message || 'Planlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const loadItems = async (planId: string) => {
    setError(null)
    setLoading(true)
    try {
      const res = await listContentItems(projectId, planId)
      const data = (res as any).data || res
      setItems(data as ContentItem[])
    } catch (e: any) {
      setError(e?.message || 'İçerikler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (projectId) loadPlans() }, [projectId])
  useEffect(() => { if (selectedPlanId) loadItems(selectedPlanId) }, [selectedPlanId])

  const generate = async () => {
    setGenError(null)
    setGenLoading(true)
    try {
      const res = await generateContentPlan(projectId, { timeframe, goal })
      const data = (res as any).data || res
      await loadPlans()
      setSelectedPlanId(data.plan.id)
    } catch (e: any) {
      setGenError(e?.message || 'Plan oluşturulamadı')
    } finally {
      setGenLoading(false)
    }
  }

  const visibleItems = items.filter((i) => channelFilter === 'all' || i.channel === channelFilter)

  const updateItemInline = async (itemId: string, patch: Partial<ContentItem>) => {
    setError(null)
    try {
      const res = await updateContentItem(itemId, {
        title: patch.title,
        description: patch.description,
        copy: patch.copy,
        status: patch.status,
        publishDate: patch.publishDate as any,
      })
      const updated = (res as any).data || res
      setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)))
    } catch (e: any) {
      setError(e?.message || 'İçerik güncellenemedi')
    }
  }

  return (
    <DashboardLayout title="İçerik Planlayıcı">
      <div className="space-y-6">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Select label="Zaman Aralığı" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
              <option value="next_30_days">Sonraki 30 gün</option>
              <option value="campaign_q1">Kampanya Q1</option>
              <option value="general">Genel</option>
            </Select>
            <Select label="Hedef" value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option value="awareness">Farkındalık</option>
              <option value="launch">Lansman</option>
              <option value="retention">Bağlılık</option>
              <option value="general">Genel</option>
            </Select>
            <Button onClick={generate} disabled={genLoading}>Yeni Plan Oluştur</Button>
            {genError && <Alert variant="error">{genError}</Alert>}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-lg font-semibold mb-3">Planlar</div>
            {loading && <Spinner />}
            {error && <Alert variant="error">{error}</Alert>}
            <div className="space-y-2">
              {plans.map((p) => (
                <button key={p.id} className={`w-full text-left px-3 py-2 rounded-lg border ${selectedPlanId === p.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:bg-gray-100'}`} onClick={() => setSelectedPlanId(p.id)}>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-gray-600">{p.timeframe || '-'}</div>
                </button>
              ))}
              {!plans.length && <div className="text-sm text-gray-600">Henüz plan yok</div>}
            </div>
          </Card>

          <div className="md:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold">İçerikler</div>
                <Select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
                  <option value="all">Tümü</option>
                  <option value="youtube">YouTube</option>
                  <option value="reels">Reels</option>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="x">X</option>
                  <option value="blog">Blog</option>
                </Select>
              </div>
              {loading && <Spinner />}
              {error && <Alert variant="error">{error}</Alert>}
              <div className="space-y-3">
                {visibleItems.map((i) => (
                  <Card key={i.id}>
                    <div className="text-xs text-gray-500 mb-1">{i.channel} {i.format ? `• ${i.format}` : ''}</div>
                    <Input value={i.title} onChange={(e) => updateItemInline(i.id, { title: e.target.value })} />
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} value={i.copy || ''} onChange={(e) => updateItemInline(i.id, { copy: e.target.value })} />
                      <div className="space-y-2">
                        <Select value={i.status} onChange={(e) => updateItemInline(i.id, { status: e.target.value })}>
                          <option value="draft">Taslak</option>
                          <option value="scheduled">Planlandı</option>
                          <option value="published">Yayınlandı</option>
                        </Select>
                        <Input type="datetime-local" value={i.publishDate ? new Date(i.publishDate).toISOString().slice(0,16) : ''} onChange={(e) => updateItemInline(i.id, { publishDate: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                      </div>
                    </div>
                  </Card>
                ))}
                {!visibleItems.length && <div className="text-sm text-gray-600">İçerik yok</div>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}