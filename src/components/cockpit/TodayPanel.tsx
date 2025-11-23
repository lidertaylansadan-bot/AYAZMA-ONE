import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../ui/Card';
import { CockpitTask, CockpitProject } from '../../hooks/useCockpitData';
import { CheckCircle2, Circle, Calendar, AlertCircle, Plus } from 'lucide-react';
import { apiCall } from '../../api/projects';
import { toast } from 'sonner';

interface TodayPanelProps {
    tasks: CockpitTask[];
    projects: CockpitProject[];
    onTasksChanged?: () => void;
}

export function TodayPanel({ tasks, projects, onTasksChanged }: TodayPanelProps) {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isCreating, setIsCreating] = useState(false);
    const [togglingTasks, setTogglingTasks] = useState<Set<string>>(new Set());

    const getDueDateBadge = (dueDate: string | null) => {
        if (!dueDate) return null;

        const due = new Date(dueDate);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

        const diffTime = dueDay.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return (
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/50 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Overdue
                </span>
            );
        } else if (diffDays === 0) {
            return (
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 rounded-full">
                    <Calendar className="w-3 h-3" />
                    Today
                </span>
            );
        } else if (diffDays <= 3) {
            return (
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/50 rounded-full">
                    <Calendar className="w-3 h-3" />
                    {diffDays}d
                </span>
            );
        }

        return null;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'text-red-400';
            case 'high': return 'text-orange-400';
            case 'normal': return 'text-blue-400';
            case 'low': return 'text-gray-400';
            default: return 'text-gray-400';
        }
    };

    const handleToggleTask = async (taskId: string, currentStatus: string) => {
        setTogglingTasks(prev => new Set(prev).add(taskId));

        try {
            const newStatus = currentStatus === 'done' ? 'pending' : 'done';

            const result = await apiCall(`/tasks/${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });

            if (result.success) {
                toast.success(newStatus === 'done' ? 'Task completed!' : 'Task reopened');
                onTasksChanged?.();
            } else {
                toast.error(result.error?.message || 'Failed to update task');
            }
        } catch (error) {
            toast.error('Failed to update task');
            console.error('Error updating task:', error);
        } finally {
            setTogglingTasks(prev => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newTaskTitle.trim()) {
            toast.error('Please enter a task title');
            return;
        }

        setIsCreating(true);

        try {
            const result = await apiCall('/tasks', {
                method: 'POST',
                body: JSON.stringify({
                    title: newTaskTitle,
                    projectId: selectedProjectId || undefined,
                    priority: 'normal',
                })
            });

            if (result.success) {
                toast.success('Task created!');
                setNewTaskTitle('');
                setSelectedProjectId('');
                onTasksChanged?.();
            } else {
                toast.error(result.error?.message || 'Failed to create task');
            }
        } catch (error) {
            toast.error('Failed to create task');
            console.error('Error creating task:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Today</h2>
                <span className="text-sm text-gray-400">{tasks.length} tasks</span>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleCreateTask} className="mb-6">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="New task..."
                            className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                            disabled={isCreating}
                        />
                    </div>
                    {projects.length > 0 && (
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                            disabled={isCreating}
                        >
                            <option value="">No Project</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    )}
                    <button
                        type="submit"
                        disabled={isCreating || !newTaskTitle.trim()}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </form>

            {/* Task List */}
            {tasks.length === 0 ? (
                <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No tasks for today</p>
                    <p className="text-gray-500 text-sm mt-1">Create a task to get started</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {tasks.map((task, index) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: index * 0.03 }}
                                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                            >
                                <button
                                    onClick={() => handleToggleTask(task.id, task.status)}
                                    disabled={togglingTasks.has(task.id)}
                                    className="mt-0.5 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                                >
                                    {task.status === 'done' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <Circle className="w-5 h-5" />
                                    )}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className={`text-sm font-medium ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                            {task.title}
                                        </h3>
                                        <div className={`text-xs font-bold ${getPriorityColor(task.priority)}`}>
                                            {task.priority !== 'normal' && task.priority.toUpperCase()}
                                        </div>
                                    </div>

                                    {task.description && (
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                                    )}

                                    <div className="flex items-center gap-2 mt-2">
                                        {getDueDateBadge(task.due_date)}
                                        {task.project_name && (
                                            <span className="px-2 py-0.5 text-xs bg-white/5 text-gray-400 rounded-full border border-white/10">
                                                {task.project_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </Card>
    );
}
