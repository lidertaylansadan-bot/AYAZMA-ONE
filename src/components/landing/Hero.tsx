import React from 'react';
import { motion } from 'framer-motion';
import { GradientButton } from '../ui/GradientButton';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Hero = () => {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[#0F172A]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] opacity-50" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-violet-600/20 rounded-full blur-[100px] opacity-30" />
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-gray-300">Next Gen AI Automation Platform</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                        Build Intelligent <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                            Agent Workflows
                        </span>
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Orchestrate multiple AI agents to build, deploy, and scale intelligent applications with enterprise-grade security and real-time monitoring.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register">
                            <GradientButton size="lg" icon={ArrowRight}>
                                Get Started Free
                            </GradientButton>
                        </Link>
                        <Link to="/login">
                            <GradientButton variant="secondary" size="lg">
                                View Demo
                            </GradientButton>
                        </Link>
                    </div>
                </motion.div>

                {/* Dashboard Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="mt-20 relative mx-auto max-w-5xl"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur opacity-20" />
                    <div className="relative rounded-2xl border border-white/10 bg-[#0F172A]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
                        <img
                            src="/dashboard-preview.png"
                            alt="Dashboard Preview"
                            className="w-full h-auto opacity-90"
                            onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/1200x800/1e293b/475569?text=Dashboard+Preview';
                            }}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
