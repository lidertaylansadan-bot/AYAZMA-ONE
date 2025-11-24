import { supabase } from '../lib/supabase';

export interface QAMetrics {
    evaluations: any[];
    autoFixes: any[];
    regressionTests: any[];
    selfRepairs: any[];
}

export const qaApi = {
    getMetrics: async (): Promise<QAMetrics> => {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        if (!token) throw new Error('No auth token');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/cockpit/qa-metrics`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch QA metrics');
        }

        return response.json();
    }
};
