import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useCockpitData } from '../hooks/useCockpitData';
import { ProjectsPanel } from '../components/cockpit/ProjectsPanel';
import { TodayPanel } from '../components/cockpit/TodayPanel';
import { CommandPalette } from '../components/cockpit/CommandPalette';
import { ActivityFeed } from '../components/cockpit/ActivityFeed';
import { StabilityQAPanel } from '../components/cockpit/StabilityQAPanel';
import { CostAlertsPanel } from '../components/cockpit/CostAlertsPanel';
import { Toaster } from 'sonner';
import { AlertCircle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Cockpit() {
    const { data, loading, error, refetch } = useCockpitData();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0F172A]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Cockpit">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-full max-w-md p-8 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="p-4 rounded-full bg-red-500/10 mb-4">
                                <AlertCircle className="w-12 h-12 text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Cockpit Yüklenemedi</h2>
                            <p className="text-gray-400 mb-8">{error.message}</p>
                            <Button
                                onClick={refetch}
                                variant="primary"
                                icon={RefreshCw}
                            >
                                Tekrar Dene
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Toaster position="top-right" theme="dark" />

            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20">
                            <LayoutDashboard className="w-8 h-8 text-indigo-400" />
                        </div>
                        Cockpit
                    </h1>
                    <p className="text-gray-400">Projeler, görevler ve ajanlar için komuta merkeziniz</p>
                </div>
                <Button
                    onClick={refetch}
                    variant="ghost"
                    size="sm"
                    icon={RefreshCw}
                    className="text-gray-400 hover:text-white hover:bg-white/5"
                >
                    Yenile
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column - Projects & Tasks */}
                <div className="xl:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <ProjectsPanel
                            projects={data.projects}
                            onAgentRunStarted={refetch}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <TodayPanel
                            tasks={data.todayTasks}
                            projects={data.projects}
                            onTasksChanged={refetch}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <StabilityQAPanel />
                    </motion.div>
                </div>

                {/* Right Column - Command Palette & Activity */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <CommandPalette
                            projects={data.projects}
                            onCommandSubmitted={refetch}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <CostAlertsPanel projects={data.projects} />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <ActivityFeed runs={data.recentAgentRuns} />
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
}
