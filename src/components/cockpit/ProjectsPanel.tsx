import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CockpitProject } from '../../hooks/useCockpitData';
import {
    Building2,
    Globe,
    Smartphone,
    Video,
    Layers,
    Folder,
    Eye,
    Wand2,
    ArrowRight
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
            case 'draft': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            case 'building': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'live': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'archived': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
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
            <div className="glass-panel p-8 text-center rounded-2xl border border-white/5">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <Folder className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
                <p className="text-gray-400 mb-6">Create your first project to get started</p>
                <Link
                    to="/dashboard"
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                    Create Project
                </Link>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <Folder className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Active Projects</h2>
                </div>
                <Link
                    to="/dashboard"
                    className="flex items-center text-sm text-gray-400 hover:text-white transition-colors group"
                >
                    View All
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="space-y-3">
                {projects.slice(0, 5).map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 transition-all duration-300"
                    >
                        <div className="flex items-center flex-1 min-w-0">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-white/5 text-indigo-400 mr-4 group-hover:scale-110 transition-transform duration-300">
                                {getProjectIcon(project.project_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                                    {project.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{project.sector}</span>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                                className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Run Agent"
                            >
                                <Wand2 className={`w-4 h-4 ${runningAgents.has(project.id) ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
