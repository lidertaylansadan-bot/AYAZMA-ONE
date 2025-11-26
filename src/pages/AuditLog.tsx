/**
 * Audit Log Page
 * View and filter agent activity logs
 */

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Search, Filter, Calendar, Download, Activity, FileText } from 'lucide-react'
import { GradientButton } from '../components/ui/GradientButton'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import { motion } from 'framer-motion'

interface AuditActivity {
    id: string
    projectId: string
    agentName: string
    activityType: string
    input?: Record<string, unknown>
    output?: Record<string, unknown>
    createdAt: string
}

export default function AuditLog() {
    const [activities, setActivities] = useState<AuditActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        projectId: '',
        agentName: '',
        search: '',
        startDate: '',
        endDate: ''
    })

    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filters.projectId) params.append('projectId', filters.projectId)
            if (filters.agentName) params.append('agentName', filters.agentName)
            if (filters.startDate) params.append('startDate', filters.startDate)
            if (filters.endDate) params.append('endDate', filters.endDate)

            const response = await fetch(`/api/audit/activities?${params.toString()}`)
            const data = await response.json()

            if (data.success) {
                setActivities(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch activities:', error)
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => {
        fetchActivities()
    }, [fetchActivities])

    const exportToCSV = () => {
        const csv = [
            ['Timestamp', 'Agent', 'Activity Type', 'Project ID'],
            ...activities.map(activity => [
                new Date(activity.createdAt).toISOString(),
                activity.agentName,
                activity.activityType,
                activity.projectId
            ])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `audit-log-${new Date().toISOString()}.csv`
        link.click()
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20">
                                <FileText className="w-8 h-8 text-orange-400" />
                            </div>
                            Audit Log
                        </h1>
                        <p className="text-gray-400">
                            View and analyze agent activity history
                        </p>
                    </div>
                    <GradientButton
                        onClick={exportToCSV}
                        icon={Download}
                        variant="secondary"
                    >
                        Export CSV
                    </GradientButton>
                </div>

                {/* Filters */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 mb-6">
                        <Filter className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-semibold text-white">Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Input
                                label="Search"
                                placeholder="Search activities..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                icon={<Search className="w-4 h-4" />}
                                className="bg-black/20 border-white/10 focus:border-indigo-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Agent
                            </label>
                            <Select
                                value={filters.agentName}
                                onChange={(e) => setFilters({ ...filters, agentName: e.target.value })}
                                options={[
                                    { value: '', label: 'All Agents' },
                                    { value: 'design_spec', label: 'Design Spec' },
                                    { value: 'workflow_designer', label: 'Workflow Designer' },
                                    { value: 'content_strategist', label: 'Content Strategist' },
                                    { value: 'orchestrator', label: 'Orchestrator' }
                                ]}
                                className="bg-black/20 border-white/10 focus:border-indigo-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Start Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                End Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity List */}
                <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-lg font-semibold text-white">
                                Activity Log ({activities.length})
                            </h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Spinner size="lg" />
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                <Activity className="w-8 h-8 text-gray-500" />
                            </div>
                            <p className="text-lg font-medium text-gray-400">No activities found</p>
                            <p className="text-sm text-gray-600 mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {activities.map((activity, index) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-6 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium rounded-full uppercase tracking-wider">
                                                    {activity.agentName.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-sm font-medium text-white">
                                                    {activity.activityType.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 font-mono">
                                                Project ID: {activity.projectId}
                                            </p>
                                        </div>
                                        <span className="text-sm text-gray-400 font-mono">
                                            {new Date(activity.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
