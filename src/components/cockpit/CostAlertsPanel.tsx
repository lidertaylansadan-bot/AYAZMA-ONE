import React, { useEffect, useState } from 'react';
import Card from '../ui/Card';
import { AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { apiCall } from '../../api/projects';
import { CockpitProject } from '../../hooks/useCockpitData';

interface ProjectBudgetStatus {
    projectId: string;
    projectName: string;
    exceeded: boolean;
    spend: number;
    budget: number;
}

interface CostAlertsPanelProps {
    projects: CockpitProject[];
}

export function CostAlertsPanel({ projects }: CostAlertsPanelProps) {
    const [statuses, setStatuses] = useState<ProjectBudgetStatus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBudgets = async () => {
            if (!projects.length) {
                setLoading(false);
                return;
            }

            try {
                const results = await Promise.all(
                    projects.map(async (project) => {
                        try {
                            const res = await apiCall(`/optimization/budget/${project.id}`);
                            if (res.success && res.data) {
                                return {
                                    projectId: project.id,
                                    projectName: project.name,
                                    ...res.data
                                };
                            }
                            return null;
                        } catch (e) {
                            console.error(`Failed to fetch budget for project ${project.id}`, e);
                            return null;
                        }
                    })
                );
                setStatuses(results.filter(Boolean) as ProjectBudgetStatus[]);
            } catch (error) {
                console.error('Error fetching budget statuses', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBudgets();
    }, [projects]);

    const alerts = statuses.filter(s => s.exceeded || s.spend > s.budget * 0.8); // Alert if exceeded or > 80%

    if (loading) return <Card loading={true}><div className="h-20" /></Card>;

    if (alerts.length === 0) {
        return (
            <Card header={
                <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-white">Cost Alerts</h3>
                </div>
            }>
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                    <DollarSign className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">Bütçe aşımı yok</p>
                </div>
            </Card>
        );
    }

    return (
        <Card header={
            <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-white">Cost Alerts</h3>
            </div>
        } className="border-red-500/20">
            <div className="space-y-4">
                {alerts.map((status) => (
                    <div key={status.projectId} className="p-3 rounded-lg bg-premium-bg/50 border border-white/5 flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-white text-sm">{status.projectName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="text-xs text-gray-400">
                                    ${status.spend.toFixed(2)} / ${status.budget.toFixed(2)}
                                </div>
                                {status.exceeded && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20">
                                        Exceeded
                                    </span>
                                )}
                                {!status.exceeded && status.spend > status.budget * 0.8 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">
                                        Near Limit
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-premium-bg flex items-center justify-center">
                            <TrendingUp className={`w-4 h-4 ${status.exceeded ? 'text-red-400' : 'text-yellow-400'}`} />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
