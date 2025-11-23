import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import DocumentsTab from '../components/project/DocumentsTab'
import { getProject, getProjectAiSettings, updateProjectAiSettings, type ProjectAiSettings } from '../api/projects'
import { getProjectAiUsageSummary, type ProjectAiUsageSummary } from '../api/telemetry'
import { getProjectOptimizationSuggestion, applyProjectOptimization } from '../api/optimizer'
import { startAgentRun } from '../api/agents'
import type { Project } from '../../shared/types'

type TabType = 'overview' | 'documents' | 'settings'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [aiSettings, setAiSettings] = useState<ProjectAiSettings | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [usageSummary, setUsageSummary] = useState<ProjectAiUsageSummary | null>(null)
  const [usageLoading, setUsageLoading] = useState(false)
  const [usageError, setUsageError] = useState<string | null>(null)
  const [optGoal, setOptGoal] = useState<'min_cost' | 'min_latency' | 'balanced'>('balanced')
  const [optLoading, setOptLoading] = useState(false)
  const [optError, setOptError] = useState<string | null>(null)
  const [optSuggestion, setOptSuggestion] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      setError(null)
      setLoading(true)
      try {
        const res = await getProject(id as string)
        if ((res as any).success === false) setError((res as any).error?.message || 'Proje yüklenemedi')
        else setProject(((res as any).data || res) as Project)
      } catch (e: any) {
        setError(e?.message || 'Proje yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  useEffect(() => {
    const loadSettings = async () => {
      if (!project) return
      setSettingsError(null)
      setSaveSuccess(null)
      setSettingsLoading(true)
      try {
        const res = await getProjectAiSettings(project.id)
        if ((res as any).success === false) {
          setAiSettings({ provider: 'openai', model: 'gpt-4o-mini', costPreference: 'balanced', latencyPreference: 'balanced' })
        } else {
          const data = (res as any).data || res
          setAiSettings(data as ProjectAiSettings)
        }
      } catch (_e) {
        setAiSettings({ provider: 'openai', model: 'gpt-4o-mini', costPreference: 'balanced', latencyPreference: 'balanced' })
      } finally {
        setSettingsLoading(false)
      }
    }
    loadSettings()
  }, [project])

  useEffect(() => {
    const loadUsage = async () => {
      if (!project) return
      setUsageError(null)
      setUsageLoading(true)
      try {
        const res = await getProjectAiUsageSummary(project.id, 30)
        const data = (res as any).data || res
        setUsageSummary(data as ProjectAiUsageSummary)
      } catch (e: any) {
        setUsageError(e?.message || 'Kullanım özeti yüklenemedi')
      } finally {
        setUsageLoading(false)
      }
    }
    loadUsage()
  }, [project])

  const runAgent = async (agentName: 'design_spec' | 'workflow_designer' | 'content_strategist') => {
    if (!project) return
    setStarting(true)
    setError(null)
    try {
      const res = await startAgentRun({ agentName, projectId: project.id })
      const data = (res as any).data || res
      const runId = data?.runId
      if (!runId) throw new Error('runId yok')
      navigate(`/agents/runs/${runId}`)
    } catch (e: any) {
      setError(e?.message || 'Agent başlatılamadı')
    } finally {
      setStarting(false)
    }
  }

  const saveAiSettings = async () => {
    if (!project || !aiSettings) return
    setSettingsError(null)
    setSaveSuccess(null)
    setSavingSettings(true)
    try {
      const res = await updateProjectAiSettings(project.id, aiSettings)
      if ((res as any).success === false) {
        setSettingsError((res as any).error?.message || 'AI ayarları kaydedilemedi')
      } else {
        const data = (res as any).data || res
        setAiSettings(data as ProjectAiSettings)
        setSaveSuccess('Ayarlar kaydedildi')
      }
    } catch (e: any) {
      setSettingsError(e?.message || 'AI ayarları kaydedilemedi')
    } finally {
      setSavingSettings(false)
    }
  }

  const fetchOptimization = async () => {
    if (!project) return
    setOptError(null)
    setOptLoading(true)
    try {
      const res = await getProjectOptimizationSuggestion(project.id, optGoal)
      const data = (res as any).data || res
      setOptSuggestion(data?.suggestion || null)
    } catch (e: any) {
      setOptError(e?.message || 'Optimizasyon önerisi alınamadı')
    } finally {
      setOptLoading(false)
    }
  }

  const applyOptimization = async () => {
    if (!project) return
    setOptError(null)
    setOptLoading(true)
    try {
      const res = await applyProjectOptimization(project.id, optGoal)
      const data = (res as any).data || res
      const suggestion = data?.suggestion || null
      setOptSuggestion(suggestion)
      if (suggestion?.suggested) {
        const updated = await updateProjectAiSettings(project.id, {
          provider: suggestion.suggested.provider,
          model: suggestion.suggested.model,
          costPreference: suggestion.suggested.costPreference,
          latencyPreference: suggestion.suggested.latencyPreference,
        })
        const updData = (updated as any).data || updated
        setAiSettings(updData as ProjectAiSettings)
      }
    } catch (e: any) {
      setOptError(e?.message || 'Optimizasyon uygulanamadı')
    } finally {
      setOptLoading(false)
    }
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Genel Bakış' },
    { id: 'documents', label: 'Dökümanlar' },
    { id: 'settings', label: 'Ayarlar' },
  ]

  return (
    <DashboardLayout title="Proje Detayı">
      {loading && <Spinner />}
      {error && <Alert variant="error">{error}</Alert>}
      {project && (
        <div className="space-y-6">
          {/* Project Header */}
          <Card>
            <div className="text-2xl font-semibold text-gray-900">{project.name}</div>
            <div className="text-gray-700 mt-2">{project.description || 'Açıklama yok'}</div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div><span className="text-gray-500">Sektör:</span> {project.sector}</div>
              <div><span className="text-gray-500">Tür:</span> {project.project_type}</div>
              <div><span className="text-gray-500">Durum:</span> {project.status}</div>
            </div>
          </Card>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold">Agents</div>
                  <Button onClick={() => navigate(`/projects/${project.id}/content`)}>İçerik Planlayıcı'ya Git</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => runAgent('design_spec')} disabled={starting}>Run Design Spec Agent</Button>
                  <Button onClick={() => runAgent('workflow_designer')} disabled={starting}>Run Workflow Agent</Button>
                  <Button onClick={() => runAgent('content_strategist')} disabled={starting}>Run Content Agent</Button>
                </div>
              </Card>

              <Card>
                <div className="text-lg font-semibold mb-4">AI Kullanım Özeti</div>
                {usageLoading && <Spinner />}
                {usageError && <Alert variant="error">{usageError}</Alert>}
                {usageSummary && (
                  <div className="space-y-3 text-sm text-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <div className="text-gray-500">Toplam Çağrı</div>
                        <div className="text-xl font-semibold">{usageSummary.totalCalls}</div>
                      </Card>
                      <Card>
                        <div className="text-gray-500">Toplam Token</div>
                        <div className="text-xl font-semibold">{usageSummary.totalTokens}</div>
                      </Card>
                      <Card>
                        <div className="text-gray-500">Ort. Gecikme</div>
                        <div className="text-xl font-semibold">{usageSummary.avgLatencyMs ?? '-'}</div>
                      </Card>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <DocumentsTab projectId={project.id} />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card>
                <div className="text-lg font-semibold mb-4">AI Ayarları</div>
                {settingsLoading && <Spinner />}
                {settingsError && <Alert variant="error">{settingsError}</Alert>}
                {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
                {aiSettings && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Sağlayıcı"
                      value={aiSettings.provider}
                      onChange={(e) => setAiSettings({ ...aiSettings, provider: e.target.value })}
                      placeholder="openai"
                    />
                    <Input
                      label="Model"
                      value={aiSettings.model}
                      onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                      placeholder="gpt-4o-mini"
                    />
                    <Select
                      label="Maliyet Tercihi"
                      value={aiSettings.costPreference}
                      onChange={(e) => setAiSettings({ ...aiSettings, costPreference: e.target.value as ProjectAiSettings['costPreference'] })}
                    >
                      <option value="low">Düşük</option>
                      <option value="balanced">Dengeli</option>
                      <option value="best_quality">En iyi kalite</option>
                    </Select>
                    <Select
                      label="Gecikme Tercihi"
                      value={aiSettings.latencyPreference}
                      onChange={(e) => setAiSettings({ ...aiSettings, latencyPreference: e.target.value as ProjectAiSettings['latencyPreference'] })}
                    >
                      <option value="low">Düşük</option>
                      <option value="balanced">Dengeli</option>
                      <option value="ok_with_slow">Yavaş olabilir</option>
                    </Select>
                    <div className="md:col-span-2 flex justify-end">
                      <Button onClick={saveAiSettings} disabled={savingSettings}>Kaydet</Button>
                    </div>
                  </div>
                )}
              </Card>

              <Card>
                <div className="text-lg font-semibold mb-4">AI Otomatik Optimizasyon</div>
                {optError && <Alert variant="error">{optError}</Alert>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <Select label="Hedef" value={optGoal} onChange={(e) => setOptGoal(e.target.value as any)}>
                    <option value="min_cost">Maliyet Odaklı</option>
                    <option value="min_latency">Hız Odaklı</option>
                    <option value="balanced">Dengeli</option>
                  </Select>
                  <Button onClick={fetchOptimization} disabled={optLoading}>Öneri Al</Button>
                  <Button onClick={applyOptimization} disabled={optLoading}>Öneriyi Uygula</Button>
                </div>
                {optLoading && <Spinner />}
                {optSuggestion && (
                  <div className="mt-4 text-sm text-gray-800">
                    <div className="text-gray-600 mb-2">Rationale:</div>
                    <div className="mb-3">{optSuggestion.rationale}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <div className="text-gray-500">Mevcut</div>
                        <div>Sağlayıcı: {optSuggestion.current.provider}</div>
                        <div>Model: {optSuggestion.current.model}</div>
                      </Card>
                      <Card>
                        <div className="text-gray-500">Önerilen</div>
                        <div>Sağlayıcı: {optSuggestion.suggested.provider}</div>
                        <div>Model: {optSuggestion.suggested.model}</div>
                      </Card>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}