/**
 * Activity Monitor Component
 * Displays real-time agent activity feed
 */

import { useState, useEffect } from 'react'
import { Activity, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface AgentActivity {
    id: string
    agentName: string
    activityType: string
    createdAt: string
    input?: any
    output?: any
}

export const ActivityMonitor = () => {
    const [activities, setActivities] = useState<AgentActivity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchActivities()
        const interval = setInterval(fetchActivities, 10000) // Refresh every 10s
        return () => clearInterval(interval)
    }, [])

    const fetchActivities = async () => {
        try {
            const response = await fetch('/api/audit/activities?limit=20')
            const data = await response.json()
            if (data.success) {
                setActivities(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch activities:', error)
        } finally {
            setLoading(false)
        }
    }

    const getActivityIcon = (type: string) => {
        if (type.includes('completed')) return <CheckCircle className="w-5 h-5 text-green-500" />
        if (type.includes('failed')) return <XCircle className="w-5 h-5 text-red-500" />
        if (type.includes('started')) return <Clock className="w-5 h-5 text-blue-500" />
        return <Activity className="w-5 h-5 text-gray-500" />
    }

    const getActivityColor = (type: string) => {
        if (type.includes('completed')) return 'bg-green-50 border-green-200'
        if (type.includes('failed')) return 'bg-red-50 border-red-200'
        if (type.includes('started')) return 'bg-blue-50 border-blue-200'
        return 'bg-gray-50 border-gray-200'
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
                <h2 className="text-xl font-semibold text-gray-900">Agent Activity Feed</h2>
                <Activity className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-3">
                {activities.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No recent activity</p>
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div
                            key={activity.id}
                            className={`p-4 rounded-lg border ${getActivityColor(activity.activityType)}`}
                        >
                            <div className="flex items-start gap-3">
                                {getActivityIcon(activity.activityType)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-gray-900">
                                            {activity.agentName}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                            {new Date(activity.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {activity.activityType.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
