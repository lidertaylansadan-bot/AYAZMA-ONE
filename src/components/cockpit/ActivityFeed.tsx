import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../ui/Card';
import { CockpitAgentRun } from '../../hooks/useCockpitData';
import { Activity, CheckCircle2, XCircle, Clock, Loader2, X } from 'lucide-react';
import { apiCall } from '../../api/projects';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
    runs: CockpitAgentRun[];
}

interface RunDetail {
    run: {
        id: string;
        agentName: string;
        status: string;
        projectId: string | null;
        createdAt: string;
        updatedAt: string;
    };
    artifacts: Array<{
        id: string;
        type: string;
        title: string;
        content: string;
        meta: Record<string, unknown>;
        createdAt: string;
    }>;
}

export function ActivityFeed({ runs }: ActivityFeedProps) {
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
    const [loading, setLoading] = useState(false);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'succeeded':
                return <CheckCircle2 className="w-4 h-4 text-green-400" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-400" />;
            case 'running':
                return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-400" />;
            default:
                return <Activity className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'succeeded':
                return 'bg-green-500/20 text-green-300 border-green-500/50';
            case 'failed':
                return 'bg-red-500/20 text-red-300 border-red-500/50';
            case 'running':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
            default:
                return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
        }
    };

    const handleRunClick = async (runId: string) => {
        setSelectedRunId(runId);
        setLoading(true);

        try {
            const result = await apiCall(`/agents/runs/${runId}`);

            if (result.success && result.data) {
                setRunDetail(result.data);
            } else {
                toast.error(result.error?.message || 'Failed to load run details');
                setSelectedRunId(null);
            }
        } catch (error) {
            toast.error('Failed to load run details');
            console.error('Error loading run details:', error);
            setSelectedRunId(null);
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedRunId(null);
        setRunDetail(null);
    };

    return (
        <>
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-bold text-white">Activity Feed</h2>
                </div>

                {runs.length === 0 ? (
                    <div className="text-center py-8">
                        <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No recent activity</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {runs.map((run, index) => (
                            <motion.button
                                key={run.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleRunClick(run.id)}
                                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        {getStatusIcon(run.status)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h3 className="text-sm font-medium text-white truncate">
                                                {run.agent_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </h3>
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(run.status)}`}>
                                                {run.status}
                                            </span>
                                        </div>

                                        {run.project_name && (
                                            <p className="text-xs text-gray-400 mb-1">{run.project_name}</p>
                                        )}

                                        <p className="text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </Card>

            {/* Modal for Run Details */}
            <AnimatePresence>
                {selectedRunId && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-panel rounded-3xl p-8 w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl border border-white/10 relative"
                        >
                            <button
                                onClick={closeModal}
                                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                                </div>
                            ) : runDetail ? (
                                <>
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusIcon(runDetail.run.status)}
                                            <h2 className="text-2xl font-bold text-white">
                                                {runDetail.run.agentName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </h2>
                                        </div>
                                        <p className="text-gray-400 text-sm">
                                            Started {formatDistanceToNow(new Date(runDetail.run.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>

                                    {runDetail.artifacts.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-400">No artifacts generated yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-white">Artifacts</h3>
                                            {runDetail.artifacts.map((artifact) => (
                                                <div key={artifact.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-sm font-semibold text-white">{artifact.title}</h4>
                                                        <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/50">
                                                            {artifact.type}
                                                        </span>
                                                    </div>
                                                    <div className="prose prose-invert prose-sm max-w-none">
                                                        <pre className="bg-black/30 p-4 rounded-lg overflow-x-auto text-xs">
                                                            <code className="text-gray-300">{artifact.content}</code>
                                                        </pre>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-400">Failed to load run details</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
