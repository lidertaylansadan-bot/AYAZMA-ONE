import React from 'react';
import { FeatureCard } from './FeatureCard';
import { Bot, Zap, Shield, BarChart3, Users, Workflow } from 'lucide-react';

const features = [
    {
        icon: Bot,
        title: "Multi-Agent Orchestration",
        description: "Coordinate multiple specialized AI agents to work together seamlessly on complex tasks."
    },
    {
        icon: Zap,
        title: "Real-time Collaboration",
        description: "Built-in Pub/Sub system ensures instant communication and data synchronization between agents."
    },
    {
        icon: Shield,
        title: "Enterprise Security",
        description: "Row Level Security (RLS) and fine-grained permissions keep your data isolated and secure."
    },
    {
        icon: Workflow,
        title: "Context Management",
        description: "Advanced context compression engine optimizes token usage while maintaining conversation history."
    },
    {
        icon: BarChart3,
        title: "Detailed Analytics",
        description: "Track agent performance, costs, and success rates with comprehensive real-time dashboards."
    },
    {
        icon: Users,
        title: "Team Collaboration",
        description: "Built for teams with role-based access control and collaborative workspace features."
    }
];

export const Features = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Powerful Features for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                            Next-Gen Applications
                        </span>
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Everything you need to build, deploy, and manage intelligent AI agent workflows at scale.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            {...feature}
                            delay={index * 0.1}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
