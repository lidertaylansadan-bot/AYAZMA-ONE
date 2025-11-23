import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../api/projects';

export interface CockpitProject {
    id: string;
    name: string;
    status: string;
    sector: string;
    project_type: string;
    updated_at: string;
}

export interface CockpitTask {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    project_id: string | null;
    project_name: string | null;
    created_at: string;
}

export interface CockpitAgentRun {
    id: string;
    agent_name: string;
    status: string;
    project_id: string | null;
    project_name: string | null;
    created_at: string;
}

export interface CockpitData {
    projects: CockpitProject[];
    todayTasks: CockpitTask[];
    recentAgentRuns: CockpitAgentRun[];
}

export function useCockpitData() {
    const [data, setData] = useState<CockpitData>({
        projects: [],
        todayTasks: [],
        recentAgentRuns: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await apiCall('/cockpit/overview');

            if (result.success && result.data) {
                setData(result.data);
            } else {
                throw new Error(result.error?.message || 'Failed to fetch cockpit data');
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            console.error('Error fetching cockpit data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
    };
}
