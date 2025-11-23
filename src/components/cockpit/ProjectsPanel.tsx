import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import { CockpitProject } from '../../hooks/useCockpitData';
import {
    Building2,
    Globe,
    Smartphone,
    Video,
    Layers,
    Folder,
    Eye,
    Wand2
} from 'lucide-react';
import { apiCall } from '../../api/projects';
import { toast } from 'sonner';

interface ProjectsPanelProps {
    projects: CockpitProject[];
    onAgentRunStarted?: () => void;
}

export function ProjectsPanel({ projects, onAgentRunStarted }: ProjectsPanelProps) {
    const [runningAgents, setRunningAgents] = React.useState<Set<string>>(new Set());

    const getProjectIcon = (type: string) => {
        switch (type) {
            case 'saas': return <Building2 className="w-5 h-5" />;
            case 'web_app': return <Globe className="w-5 h-5" />;
            case 'mobile_app': return <Smartphone className="w-5 h-5" />;
            case 'media': return <Video className="w-5 h-5" />;
            case 'hybrid': return <Layers className="w-5 h-5" />;
            default: return <Folder className="w-5 h-5" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-700/50 text-gray-300 border border-gray-600';
            case 'building': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50';
            case 'live': return 'bg-green-500/20 text-green-300 border border-green-500/50';
            case 'archived': return 'bg-red-500/20 text-red-300 border border-red-500/50';
            default: return 'bg-gray-700/50 text-gray-300 border border-gray-600';
        }
    };

    const handleRunAgent = async (projectId: string) => {
        setRunningAgents(prev => new Set(prev).add(projectId));

        try {
            const result = await apiCall('/agents/run', {
                method: 'POST',
                body: JSON.stringify({
                    agentName: 'orchestrator',
                    projectId,
                    context: {
                        extra: {
                            source: 'cockpit_projects_panel'
                        }
                    }
                })
            });

            if (result.success) {
                toast.success('Agent started successfully');
                onAgentRunStarted?.();
            } else {
                toast.error(result.error?.message || 'Failed to start agent');
            }
        } catch (error) {
            toast.error('Failed to start agent');
            console.error('Error starting agent:', error);
        } finally {
            setRunningAgents(prev => {
                const next = new Set(prev);
                next.delete(projectId);
                return next;
            });
        }
    };

    if (projects.length === 0) {
        return (
            <Card className="p-8 text-center border-dashed border-2 border-white/10">
                <Folder className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No projects yet</p>
                <Link to="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
                    Create your first project
                </Link>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Projects</h2>
                <Link to="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">
                    View All
                </Link>
            </div>

            <div className="space-y-3">
                {projects.slice(0, 5).map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                    >
                        <div className="flex items-center flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-white/5 text-blue-400 mr-3">
                                {getProjectIcon(project.project_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-400 uppercase">{project.sector}</span>
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                            <Link
                                to={`/projects/${project.id}`}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                title="View Details"
                            >
                                <Eye className="w-4 h-4" />
                            </Link>
                            <button
                                onClick={() => handleRunAgent(project.id)}
                                disabled={runningAgents.has(project.id)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Run Agent"
                            >
                                <Wand2 className={`w-4 h-4 ${runningAgents.has(project.id) ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Card>
    );
}
