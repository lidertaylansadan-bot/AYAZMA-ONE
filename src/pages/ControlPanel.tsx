/**
 * Control Panel Page
 * Main monitoring dashboard for agents and system
 */

import { Layout } from '../components/Layout'
import { ActivityMonitor } from '../components/control-panel/ActivityMonitor'
import { PermissionMatrix } from '../components/control-panel/PermissionMatrix'
import { AgentDashboard } from '../components/control-panel/AgentDashboard'
import { BarChart3 } from 'lucide-react'

export default function ControlPanel() {
    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Control Panel</h1>
                        <p className="text-gray-600 mt-1">
                            Monitor agent activity, permissions, and performance
                        </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>

                {/* Agent Dashboard */}
                <AgentDashboard />

                {/* Activity Monitor and Permission Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ActivityMonitor />
                    <PermissionMatrix />
                </div>
            </div>
        </Layout>
    )
}
