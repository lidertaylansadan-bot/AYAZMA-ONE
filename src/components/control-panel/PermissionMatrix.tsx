/**
 * Permission Matrix Component
 * Visual grid showing agent permissions across projects
 */

import { useState, useEffect } from 'react'
import { Shield, Lock, Unlock, Eye } from 'lucide-react'

const AGENTS = ['design_spec', 'workflow_designer', 'content_strategist', 'orchestrator']

interface Project {
    id: string
    name: string
}

export const PermissionMatrix = () => {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Fetch projects
            const projectsRes = await fetch('/api/projects')
            const projectsData = await projectsRes.json()

            if (projectsData.success) {
                setProjects(projectsData.data.slice(0, 5)) // Show first 5 projects
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getPermissionIcon = (permission: string) => {
        switch (permission) {
            case 'write':
                return <Unlock className="w-4 h-4 text-green-600" />
            case 'read':
                return <Eye className="w-4 h-4 text-blue-600" />
            default:
                return <Lock className="w-4 h-4 text-gray-400" />
        }
    }

    const getPermissionBadge = (permission: string) => {
        switch (permission) {
            case 'write':
                return 'bg-green-100 text-green-800'
            case 'read':
                return 'bg-blue-100 text-blue-800'
            default:
                return 'bg-gray-100 text-gray-600'
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
                <h2 className="text-xl font-semibold text-gray-900">Permission Matrix</h2>
                <Shield className="w-5 h-5 text-gray-400" />
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No projects found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Project
                                </th>
                                {AGENTS.map((agent) => (
                                    <th
                                        key={agent}
                                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {agent.replace(/_/g, ' ')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {projects.map((project) => (
                                <tr key={project.id}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {project.name}
                                    </td>
                                    {AGENTS.map((agent) => {
                                        const permission = 'none' // Default, would fetch from API
                                        return (
                                            <td key={agent} className="px-4 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPermissionBadge(permission)}`}>
                                                    {getPermissionIcon(permission)}
                                                    {permission}
                                                </span>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
