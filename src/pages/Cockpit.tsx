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
            <div className="flex h-screen items-center justify-center bg-premium-bg">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Cockpit">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Card className="w-full max-w-md border-red-500/20">
                        <div className="flex flex-col items-center justify-center py-8 text-center">
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
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Cockpit">
            <Toaster position="top-right" theme="dark" />

            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <LayoutDashboard className="w-8 h-8 text-indigo-400" />
                        Cockpit
                    </h1>
                    <p className="text-premium-muted">Projeler, görevler ve ajanlar için komuta merkeziniz</p>
                </div>
                <Button
                    onClick={refetch}
                    variant="ghost"
                    size="sm"
                    icon={RefreshCw}
                    className="text-gray-400 hover:text-white"
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
