/**
 * Agent Dashboard Component
 * Shows agent performance metrics and status
 */

import { useState, useEffect } from 'react'
import { Bot, TrendingUp, Clock, DollarSign, Activity } from 'lucide-react'

interface AgentStats {
    agentName: string
    totalRuns: number
    successRate: number
    avgDuration: number
    totalCost: number
}

export const AgentDashboard = () => {
    const [stats, setStats] = useState<AgentStats[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            // Mock data for now - would fetch from audit API
            const mockStats: AgentStats[] = [
                {
                    agentName: 'design_spec',
                    totalRuns: 45,
                    successRate: 95.5,
                    avgDuration: 2500,
                    totalCost: 1.25
                },
                {
                    agentName: 'workflow_designer',
                    totalRuns: 32,
                    successRate: 93.8,
                    avgDuration: 3200,
                    totalCost: 0.98
                },
                {
                    agentName: 'content_strategist',
                    totalRuns: 28,
                    successRate: 96.4,
                    avgDuration: 2100,
                    totalCost: 0.76
                }
            ]
            setStats(mockStats)
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Agent Performance</h2>
                <Bot className="w-5 h-5 text-gray-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((agent) => (
                    <div
                        key={agent.agentName}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-gray-900">
                                {agent.agentName.replace(/_/g, ' ')}
                            </h3>
                            <Activity className="w-4 h-4 text-blue-600" />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Total Runs</span>
                                <span className="font-semibold text-gray-900">{agent.totalRuns}</span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    Success Rate
                                </span>
                                <span className="font-semibold text-green-600">
                                    {agent.successRate.toFixed(1)}%
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Avg Duration
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {(agent.avgDuration / 1000).toFixed(1)}s
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    Total Cost
                                </span>
                                <span className="font-semibold text-gray-900">
                                    ${agent.totalCost.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
