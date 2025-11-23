import { useState } from 'react'
import Card from '../ui/Card'
import { motion, AnimatePresence } from 'framer-motion'

interface ContextSlice {
    id: string
    type: 'project_meta' | 'document' | 'agent_history' | 'user_input' | 'system'
    content: string
    weight: number
    sourceMeta?: {
        documentId?: string
        documentTitle?: string
        chunkId?: string
        chunkIndex?: number
        agentRunId?: string
        similarity?: number
    }
}

interface ContextUsage {
    id: string
    context_source: string
    document_id?: string
    chunk_id?: string
    weight: number
    document_title?: string
    chunk_text?: string
    similarity?: number
}

interface ContextVisualizationProps {
    contextSlices?: ContextSlice[]
    contextUsages?: ContextUsage[]
    totalTokens?: number
}

export default function ContextVisualization({
    contextSlices,
    contextUsages,
    totalTokens,
}: ContextVisualizationProps) {
    const [expandedSlice, setExpandedSlice] = useState<string | null>(null)

    // If no context data, show empty state
    if (!contextSlices && !contextUsages) {
        return (
            <Card>
                <div className="text-center text-gray-500 py-8">
                    <div className="text-lg font-medium mb-2">Context Kullanılmadı</div>
                    <div className="text-sm">Bu agent run için context oluşturulmadı</div>
                </div>
            </Card>
        )
    }

    const slices = contextSlices || []
    const usages = contextUsages || []

    // Count sources
    const sourceCounts: Record<string, number> = {}
    slices.forEach((slice) => {
        sourceCounts[slice.type] = (sourceCounts[slice.type] || 0) + 1
    })

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            project_meta: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            document: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            agent_history: 'bg-green-500/20 text-green-400 border-green-500/30',
            user_input: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            system: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        }
        return colors[type] || colors.system
    }

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            project_meta: 'Proje Bilgisi',
            document: 'Döküman',
            agent_history: 'Agent Geçmişi',
            user_input: 'Kullanıcı Girdisi',
            system: 'Sistem',
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
                        <div className="text-gray-400 text-sm mb-1">Toplam Slice</div>
                        <div className="text-2xl font-bold text-white">{slices.length}</div>
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

            {/* Context Slices */}
            <div className="space-y-3">
                <h4 className="text-lg font-semibold text-white">Context Slices</h4>
                {slices.length === 0 && (
                    <Card>
                        <div className="text-center text-gray-500 py-4">
                            Context slice bulunamadı
                        </div>
                    </Card>
                )}
                {slices.map((slice, index) => (
                    <motion.div
                        key={slice.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card hover>
                            <div className="space-y-3">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide border ${getTypeColor(slice.type)}`}>
                                            {getTypeLabel(slice.type)}
                                        </span>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <span>Weight:</span>
                                            <span className="font-semibold text-white">{slice.weight.toFixed(2)}</span>
                                        </div>
                                        {slice.sourceMeta?.similarity && (
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <span>Similarity:</span>
                                                <span className="font-semibold text-green-400">
                                                    {(slice.sourceMeta.similarity * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setExpandedSlice(expandedSlice === slice.id ? null : slice.id)}
                                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                                    >
                                        {expandedSlice === slice.id ? 'Gizle' : 'Göster'}
                                    </button>
                                </div>

                                {/* Source Meta */}
                                {slice.sourceMeta?.documentTitle && (
                                    <div className="text-sm text-gray-400">
                                        <span className="text-gray-500">Kaynak:</span>{' '}
                                        <span className="text-gray-300">{slice.sourceMeta.documentTitle}</span>
                                        {slice.sourceMeta.chunkIndex !== undefined && (
                                            <span className="ml-2 text-gray-500">
                                                (Chunk #{slice.sourceMeta.chunkIndex + 1})
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Content Preview */}
                                <div className="text-sm text-gray-300">
                                    {slice.content.substring(0, 150)}
                                    {slice.content.length > 150 && '...'}
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {expandedSlice === slice.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-3 border-t border-gray-700/50">
                                                <div className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono">
                                                    {slice.content}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
