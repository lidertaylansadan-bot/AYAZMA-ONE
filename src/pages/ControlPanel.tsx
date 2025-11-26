/**
 * Control Panel Page
 * Main monitoring dashboard for agents and system
 */

import DashboardLayout from '../components/layout/DashboardLayout'
import { ActivityMonitor } from '../components/control-panel/ActivityMonitor'
import { PermissionMatrix } from '../components/control-panel/PermissionMatrix'
import { AgentDashboard } from '../components/control-panel/AgentDashboard'
import { BarChart3, LayoutDashboard } from 'lucide-react'

export default function ControlPanel() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                                <BarChart3 className="w-8 h-8 text-blue-400" />
                            </div>
                            Control Panel
                        </h1>
                        <p className="text-gray-400">
                            Monitor agent activity, permissions, and performance
                        </p>
                    </div>
                </div>

                {/* Agent Dashboard */}
                <AgentDashboard />

                {/* Activity Monitor and Permission Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ActivityMonitor />
                    <PermissionMatrix />
                </div>
            </div>
        </DashboardLayout>
    )
}
