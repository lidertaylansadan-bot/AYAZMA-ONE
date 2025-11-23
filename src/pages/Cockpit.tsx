import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Spinner from '../components/ui/Spinner';
import { useCockpitData } from '../hooks/useCockpitData';
import { ProjectsPanel } from '../components/cockpit/ProjectsPanel';
import { TodayPanel } from '../components/cockpit/TodayPanel';
import { CommandPalette } from '../components/cockpit/CommandPalette';
import { ActivityFeed } from '../components/cockpit/ActivityFeed';
import { Toaster } from 'sonner';
import { AlertCircle } from 'lucide-react';

export default function Cockpit() {
    const { data, loading, error, refetch } = useCockpitData();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Cockpit">
                <div className="flex flex-col items-center justify-center py-24">
                    <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Error Loading Cockpit</h2>
                    <p className="text-gray-400 mb-6">{error.message}</p>
                    <button
                        onClick={refetch}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all"
                    >
                        Retry
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Cockpit">
            <Toaster position="top-right" theme="dark" />

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Cockpit</h1>
                <p className="text-gray-400">Your command center for projects, tasks, and agents</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column - Projects & Tasks */}
                <div className="xl:col-span-2 space-y-6">
                    <ProjectsPanel
                        projects={data.projects}
                        onAgentRunStarted={refetch}
                    />
                    <TodayPanel
                        tasks={data.todayTasks}
                        projects={data.projects}
                        onTasksChanged={refetch}
                    />
                </div>

                {/* Right Column - Command Palette & Activity */}
                <div className="space-y-6">
                    <CommandPalette
                        projects={data.projects}
                        onCommandSubmitted={refetch}
                    />
                    <ActivityFeed runs={data.recentAgentRuns} />
                </div>
            </div>
        </DashboardLayout>
    );
}
