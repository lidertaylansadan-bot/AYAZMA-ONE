/**
 * Audit Log Page
 * View and filter agent activity logs
 */

import { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/Layout'
import { Search, Filter, Calendar, Download, Activity } from 'lucide-react'

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
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
                        <p className="text-gray-600 mt-1">
                            View and analyze agent activity history
                        </p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search activities..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Agent
                            </label>
                            <select
                                value={filters.agentName}
                                onChange={(e) => setFilters({ ...filters, agentName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Agents</option>
                                <option value="design_spec">Design Spec</option>
                                <option value="workflow_designer">Workflow Designer</option>
                                <option value="content_strategist">Content Strategist</option>
                                <option value="orchestrator">Orchestrator</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                Activity Log ({activities.length})
                            </h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No activities found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {activities.map((activity) => (
                                <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                    {activity.agentName.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    {activity.activityType.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Project ID: {activity.projectId}
                                            </p>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(activity.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
