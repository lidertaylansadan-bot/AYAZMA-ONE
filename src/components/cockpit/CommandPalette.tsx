import React, { useState } from 'react';
import Card from '../ui/Card';
import { CockpitProject } from '../../hooks/useCockpitData';
import { Send, Terminal } from 'lucide-react';
import { apiCall } from '../../api/projects';
import { toast } from 'sonner';

interface CommandPaletteProps {
    projects: CockpitProject[];
    onCommandSubmitted?: () => void;
}

export function CommandPalette({ projects, onCommandSubmitted }: CommandPaletteProps) {
    const [command, setCommand] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isRunning, setIsRunning] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!command.trim()) {
            toast.error('Please enter a command');
            return;
        }

        setIsRunning(true);

        try {
            const result = await apiCall('/agents/run', {
                method: 'POST',
                body: JSON.stringify({
                    agentName: 'orchestrator',
                    projectId: selectedProjectId || undefined,
                    context: {
                        extra: {
                            command: command.trim(),
                            source: 'cockpit_command_palette'
                        }
                    }
                })
            });

            if (result.success && result.data?.runId) {
                toast.success(`Command submitted! Run ID: ${result.data.runId.slice(0, 8)}...`);
                setCommand('');
                setSelectedProjectId('');
                onCommandSubmitted?.();
            } else {
                toast.error(result.error?.message || 'Failed to submit command');
            }
        } catch (error) {
            toast.error('Failed to submit command');
            console.error('Error submitting command:', error);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">Command Palette</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <textarea
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="Enter command (e.g., Generate pricing analysis for Ayazma...)"
                        rows={4}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all resize-none font-mono text-sm"
                        disabled={isRunning}
                    />
                </div>

                {projects.length > 0 && (
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                            Project (Optional)
                        </label>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                            disabled={isRunning}
                        >
                            <option value="">No specific project</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isRunning || !command.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                    {isRunning ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Running...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Submit Command
                        </>
                    )}
                </button>
            </form>

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-blue-300">
                    <strong>Tip:</strong> Commands are processed by the orchestrator agent. Be specific about what you want to achieve.
                </p>
            </div>
        </Card>
    );
}
