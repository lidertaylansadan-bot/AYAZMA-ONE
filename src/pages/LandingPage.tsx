import React from 'react';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { Link } from 'react-router-dom';
import { GradientButton } from '../components/ui/GradientButton';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0F172A] selection:bg-indigo-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="text-white font-bold text-xl">A1</span>
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Ayazma ONE</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Features</a>
                        <a href="#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Pricing</a>
                        <a href="#docs" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Documentation</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link to="/register">
                            <GradientButton size="sm">Get Started</GradientButton>
                        </Link>
                    </div>
                </div>
            </nav>

            <main>
                <Hero />
                <Features />

                {/* CTA Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-[#0F172A]" />
                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <h2 className="text-4xl font-bold text-white mb-6">
                            Ready to Start Building?
                        </h2>
                        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                            Join thousands of developers building the future of AI automation with Ayazma ONE.
                        </p>
                        <Link to="/register">
                            <GradientButton size="lg" className="min-w-[200px]">
                                Start Building Now
                            </GradientButton>
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 bg-[#0B1120]">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">© 2024 Ayazma ONE. All rights reserved.</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <a href="#" className="text-gray-500 hover:text-white transition-colors">Twitter</a>
                            <a href="#" className="text-gray-500 hover:text-white transition-colors">GitHub</a>
                            <a href="#" className="text-gray-500 hover:text-white transition-colors">Discord</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
