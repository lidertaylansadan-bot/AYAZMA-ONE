import React, { useEffect, useState } from 'react';
import { qaApi, QAMetrics } from '../../api/qa';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertCircle, CheckCircle, Activity, Wrench, ShieldCheck, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function StabilityQAPanel() {
    const [metrics, setMetrics] = useState<QAMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            const data = await qaApi.getMetrics();
            setMetrics(data);
        } catch (err) {
            setError('Failed to load QA metrics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Loading QA Metrics...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!metrics) return null;

    // Prepare chart data
    const evalChartData = metrics.evaluations.slice(0, 10).reverse().map((e: any) => ({
        name: new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        score: e.score_weighted || 0,
        type: e.task_type
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Stability & QA</h2>
                <button onClick={loadMetrics} className="p-2 hover:bg-gray-100 rounded-full">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card
                    header={
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium text-white">Avg Quality Score</h3>
                            <Activity className="h-4 w-4 text-gray-400" />
                        </div>
                    }
                    hover={false}
                >
                    <div className="text-2xl font-bold text-white">
                        {(metrics.evaluations.reduce((acc, curr) => acc + (curr.score_weighted || 0), 0) / (metrics.evaluations.length || 1)).toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-400">Last {metrics.evaluations.length} runs</p>
                </Card>
                <Card
                    header={
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium text-white">Auto-Fixes</h3>
                            <Wrench className="h-4 w-4 text-gray-400" />
                        </div>
                    }
                    hover={false}
                >
                    <div className="text-2xl font-bold text-white">{metrics.autoFixes.length}</div>
                    <p className="text-xs text-gray-400">Recent interventions</p>
                </Card>
                <Card
                    header={
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium text-white">Regression Tests</h3>
                            <ShieldCheck className="h-4 w-4 text-gray-400" />
                        </div>
                    }
                    hover={false}
                >
                    <div className="text-2xl font-bold text-white">
                        {metrics.regressionTests.filter((t: any) => t.last_status === 'pass').length} / {metrics.regressionTests.length}
                    </div>
                    <p className="text-xs text-gray-400">Passing tests</p>
                </Card>
                <Card
                    header={
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium text-white">Self-Repairs</h3>
                            <RefreshCw className="h-4 w-4 text-gray-400" />
                        </div>
                    }
                    hover={false}
                >
                    <div className="text-2xl font-bold text-white">{metrics.selfRepairs.length}</div>
                    <p className="text-xs text-gray-400">Config updates</p>
                </Card>
            </div>

            <Tabs defaultValue="evals" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="evals">Evaluations</TabsTrigger>
                    <TabsTrigger value="regression">Regression Tests</TabsTrigger>
                    <TabsTrigger value="autofix">Auto-Fix & Repair</TabsTrigger>
                </TabsList>

                <TabsContent value="evals" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Evaluation Scores</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={evalChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 1]} />
                                        <Tooltip />
                                        <Bar dataKey="score" fill="#8884d8">
                                            {evalChartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.score < 0.6 ? '#ef4444' : '#22c55e'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="regression" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Regression Test Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {metrics.regressionTests.map((test: any) => (
                                    <div key={test.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{test.test_name}</p>
                                            <p className="text-xs text-muted-foreground">Agent: {test.agent_name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                {test.last_run_at ? new Date(test.last_run_at).toLocaleDateString() : 'Never run'}
                                            </span>
                                            {test.last_status === 'pass' ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : test.last_status === 'fail' ? (
                                                <AlertCircle className="h-5 w-5 text-red-500" />
                                            ) : (
                                                <div className="h-5 w-5 rounded-full bg-gray-200" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {metrics.regressionTests.length === 0 && (
                                    <div className="text-center text-muted-foreground py-4">No regression tests defined</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="autofix" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Auto-Fixes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {metrics.autoFixes.map((fix: any) => (
                                        <div key={fix.id} className="border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-medium text-sm">Run {fix.agent_run_id.slice(0, 8)}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(fix.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{fix.fix_notes}</p>
                                        </div>
                                    ))}
                                    {metrics.autoFixes.length === 0 && (
                                        <div className="text-center text-muted-foreground py-4">No auto-fixes recorded</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Self-Repair Events</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {metrics.selfRepairs.map((repair: any) => (
                                        <div key={repair.id} className="border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-medium text-sm">Config Update</span>
                                                <span className="text-xs text-muted-foreground">{new Date(repair.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {JSON.stringify(repair.metadata?.changes || {})}
                                            </p>
                                        </div>
                                    ))}
                                    {metrics.selfRepairs.length === 0 && (
                                        <div className="text-center text-muted-foreground py-4">No self-repair events</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
