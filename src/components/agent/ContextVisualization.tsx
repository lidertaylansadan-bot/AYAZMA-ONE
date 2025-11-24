import Card from '../ui/Card'
import ContextSliceCard from './ContextSliceCard'
import { ContextUsage } from '../../api/agents'

interface ContextVisualizationProps {
    contextUsages?: ContextUsage[]
    totalTokens?: number
}

export default function ContextVisualization({
    contextUsages,
    totalTokens,
}: ContextVisualizationProps) {
    // If no context data, show empty state
    if (!contextUsages || contextUsages.length === 0) {
        return (
            <Card>
                <div className="text-center text-gray-500 py-8">
                    <div className="text-lg font-medium mb-2">Context Kullanılmadı</div>
                    <div className="text-sm">Bu agent run için context oluşturulmadı</div>
                </div>
            </Card>
        )
    }

    const usages = contextUsages

    // Count sources
    const sourceCounts: Record<string, number> = {}
    usages.forEach((usage) => {
        sourceCounts[usage.context_source] = (sourceCounts[usage.context_source] || 0) + 1
    })

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            project_meta: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            rag_search: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            agent_history: 'bg-green-500/20 text-green-400 border-green-500/30',
            compressed_segment: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        }
        return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            project_meta: 'Proje Bilgisi',
            rag_search: 'RAG Arama',
            agent_history: 'Agent Geçmişi',
            compressed_segment: 'Sıkıştırılmış Segment',
        }
        return labels[type] || type
    }

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <Card>
                <div className="text-lg font-semibold text-white mb-4">Context Özeti</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-gray-400 text-sm mb-1">Toplam Parça</div>
                        <div className="text-2xl font-bold text-white">{usages.length}</div>
                    </div>
                    {totalTokens && (
                        <div>
                            <div className="text-gray-400 text-sm mb-1">Toplam Token</div>
                            <div className="text-2xl font-bold text-white">{totalTokens.toLocaleString()}</div>
                        </div>
                    )}
                    <div className="md:col-span-2">
                        <div className="text-gray-400 text-sm mb-2">Kaynak Türleri</div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(sourceCounts).map(([type, count]) => (
                                <span
                                    key={type}
                                    className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(type)}`}
                                >
                                    {getTypeLabel(type)}: {count}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Context Slices List */}
            <div className="space-y-3">
                <h4 className="text-lg font-semibold text-white">Context Detayları</h4>
                {usages.map((usage) => (
                    <ContextSliceCard key={usage.id} usage={usage} />
                ))}
            </div>
        </div>
    )
}
