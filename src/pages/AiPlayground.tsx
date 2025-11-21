import { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import { aiComplete, AiTaskType } from '../api/ai'

export default function AiPlayground() {
  const [taskType, setTaskType] = useState<AiTaskType>('generic_chat')
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<{ provider: string; model: string; text: string; usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number; costUsd?: number; latencyMs?: number } } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAi = async () => {
    setError(null)
    setResult(null)
    if (!prompt.trim()) {
      setError('Lütfen prompt girin')
      return
    }
    setLoading(true)
    try {
      const res = await aiComplete({ taskType, prompt })
      if ((res as any).success === false) {
        setError((res as any).error?.message || 'AI isteği başarısız oldu')
      } else {
        const data = (res as any).data || res
        setResult({ provider: data.provider, model: data.model, text: data.text, usage: data.usage })
      }
    } catch (e: any) {
      setError(e?.message || 'AI isteği başarısız oldu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="AI Playground">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="space-y-4">
            <Select label="Görev Türü" value={taskType} onChange={(e) => setTaskType(e.target.value as AiTaskType)}>
              <option value="generic_chat">Generic Chat</option>
              <option value="app_spec_suggestion">SaaS Spec Suggestion</option>
              <option value="feature_brainstorm">Feature Brainstorm</option>
              <option value="workflow_suggestion">Workflow Suggestion</option>
              <option value="marketing_copy">Marketing Copy</option>
            </Select>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={8}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="AI için promptinizi yazın"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={runAi}>Run AI</Button>
            </div>
          </div>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          {loading && <Spinner />}
          {error && <Alert variant="error">{error}</Alert>}
          {result && (
            <Card>
              <div className="text-sm text-gray-500 mb-2">{result.provider} • {result.model}</div>
              <div className="whitespace-pre-wrap text-gray-900">{result.text}</div>
              {result.usage && (
                <div className="mt-4 text-xs text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <div className="text-gray-500">Input Tokens</div>
                    <div>{result.usage.inputTokens ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Output Tokens</div>
                    <div>{result.usage.outputTokens ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total Tokens</div>
                    <div>{result.usage.totalTokens ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Latency</div>
                    <div>{result.usage.latencyMs ? `${result.usage.latencyMs} ms` : '-'}</div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}