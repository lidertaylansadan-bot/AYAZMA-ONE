import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Database, History, Minimize, ChevronDown, ChevronUp } from 'lucide-react'
import Card from '../ui/Card'
import { ContextUsage } from '../../api/agents'

interface ContextSliceCardProps {
    usage: ContextUsage
}

export default function ContextSliceCard({ usage }: ContextSliceCardProps) {
    const [expanded, setExpanded] = useState(false)

    const getIcon = () => {
        switch (usage.context_source) {
            case 'rag_search':
                return <FileText className="w-4 h-4 text-blue-400" />
            case 'project_meta':
                return <Database className="w-4 h-4 text-purple-400" />
            case 'agent_history':
                return <History className="w-4 h-4 text-green-400" />
            case 'compressed_segment':
                return <Minimize className="w-4 h-4 text-orange-400" />
            default:
                return <FileText className="w-4 h-4 text-gray-400" />
        }
    }

    const getLabel = () => {
        switch (usage.context_source) {
            case 'rag_search':
                return 'RAG Search'
            case 'project_meta':
                return 'Project Meta'
            case 'agent_history':
                return 'Agent History'
            case 'compressed_segment':
                return 'Compressed Segment'
            default:
                return usage.context_source
        }
    }

    const getColorClass = () => {
        switch (usage.context_source) {
            case 'rag_search':
                return 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            case 'project_meta':
                return 'bg-purple-500/10 border-purple-500/20 text-purple-400'
            case 'agent_history':
                return 'bg-green-500/10 border-green-500/20 text-green-400'
            case 'compressed_segment':
                return 'bg-orange-500/10 border-orange-500/20 text-orange-400'
            default:
                return 'bg-gray-500/10 border-gray-500/20 text-gray-400'
        }
    }

    return (
        <Card hover className="transition-colors duration-200">
            <div className="space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getColorClass()}`}>
                            {getIcon()}
                            <span>{getLabel()}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                                <span>Weight:</span>
                                <span className="font-medium text-white">{usage.weight.toFixed(2)}</span>
                            </div>

                            {usage.similarity && (
                                <div className="flex items-center gap-1">
                                    <span>Similarity:</span>
                                    <span className="font-medium text-green-400">
                                        {(usage.similarity * 100).toFixed(1)}%
                                    </span>
                                </div>
                            )}

                            {usage.token_count && (
                                <div className="flex items-center gap-1">
                                    <span>Tokens:</span>
                                    <span className="font-medium text-gray-300">{usage.token_count}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button className="text-gray-400 hover:text-white transition-colors">
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                {/* Source Info */}
                <div className="text-sm text-gray-400 pl-1">
                    {usage.document_title && (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">Source:</span>
                            <span className="text-gray-300 font-medium">{usage.document_title}</span>
                            {usage.chunk_id && <span className="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">Chunk {usage.chunk_id.slice(0, 8)}...</span>}
                        </div>
                    )}
                </div>

                {/* Content Preview */}
                {!expanded && (
                    <div className="text-sm text-gray-500 line-clamp-2 font-mono bg-gray-900/30 p-2 rounded border border-gray-800">
                        {usage.chunk_text || usage.segment_preview || 'No content preview available'}
                    </div>
                )}

                {/* Expanded Content */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-3 mt-2 border-t border-gray-800">
                                <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono border border-gray-800">
                                    {usage.chunk_text || usage.segment_preview || 'No content available'}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    )
}
