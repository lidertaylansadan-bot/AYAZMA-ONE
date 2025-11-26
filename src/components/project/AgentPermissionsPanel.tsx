import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Alert from '../ui/Alert'
import Spinner from '../ui/Spinner'
import Select from '../ui/Select'

interface AgentPermissionsPanelProps {
    projectId: string
}

const AVAILABLE_AGENTS = [
    { name: 'design_spec', label: 'Design Spec Agent' },
    { name: 'workflow_designer', label: 'Workflow Designer' },
    { name: 'content_strategist', label: 'Content Strategist' },
]

export default function AgentPermissionsPanel({ projectId }: AgentPermissionsPanelProps) {
    const [permissions, setPermissions] = useState<Record<string, 'read' | 'write' | 'none'>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState<string | null>(null) // agent name being saved

    const loadPermissions = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from('agent_permissions')
                .select('agent_name, permission_level')
                .eq('project_id', projectId)

            if (error) throw error

            const permMap: Record<string, 'read' | 'write' | 'none'> = {}
            // Initialize with 'none'
            AVAILABLE_AGENTS.forEach(a => permMap[a.name] = 'none')

            // Override with actual permissions
            data?.forEach((p: { agent_name: string; permission_level: 'read' | 'write' }) => {
                permMap[p.agent_name] = p.permission_level
            })

            setPermissions(permMap)
        } catch (err: any) {
            setError(err.message || 'Failed to load permissions')
        } finally {
            setLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        loadPermissions()
    }, [loadPermissions])

    const updatePermission = async (agentName: string, level: 'read' | 'write' | 'none') => {
        setSaving(agentName)
        setError(null)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            if (level === 'none') {
                // Delete permission
                const { error } = await supabase
                    .from('agent_permissions')
                    .delete()
                    .eq('project_id', projectId)
                    .eq('agent_name', agentName)

                if (error) throw error
            } else {
                // Upsert permission
                const { error } = await supabase
                    .from('agent_permissions')
                    .upsert({
                        project_id: projectId,
                        user_id: user.id,
                        agent_name: agentName,
                        permission_level: level
                    }, {
                        onConflict: 'project_id,agent_name'
                    })

                if (error) throw error
            }

            setPermissions(prev => ({ ...prev, [agentName]: level }))
        } catch (err: any) {
            setError(err.message || 'Failed to update permission')
        } finally {
            setSaving(null)
        }
    }

    if (loading) return <Spinner />

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Agent Permissions</h3>
                <Button variant="secondary" size="sm" onClick={loadPermissions}>Refresh</Button>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    Control which agents can access and modify this project's data.
                </p>

                <div className="divide-y divide-gray-200">
                    {AVAILABLE_AGENTS.map(agent => (
                        <div key={agent.name} className="py-3 flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">{agent.label}</div>
                                <div className="text-xs text-gray-500 font-mono">{agent.name}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                {saving === agent.name && <Spinner size="sm" />}
                                <Select
                                    value={permissions[agent.name] || 'none'}
                                    onChange={(e) => updatePermission(agent.name, e.target.value as any)}
                                    disabled={saving === agent.name}
                                    className="w-32"
                                >
                                    <option value="none">No Access</option>
                                    <option value="read">Read Only</option>
                                    <option value="write">Read & Write</option>
                                </Select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    )
}
