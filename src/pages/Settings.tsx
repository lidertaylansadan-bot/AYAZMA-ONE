import React, { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import Button from '../components/ui/Button'
import { GradientButton } from '../components/ui/GradientButton'
import Input from '../components/ui/Input'
import { User, Bell, Shield, Palette, Save, LogOut, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '../components/theme-provider'

export default function Settings() {
    const [loading, setLoading] = useState(false)
    const { theme, setTheme } = useTheme()

    const handleSave = () => {
        setLoading(true)
        // Simulate API call
        setTimeout(() => {
            setLoading(false)
            toast.success('Settings saved successfully')
        }, 1000)
    }

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-gray-400">Manage your account preferences and application settings</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl w-full md:w-auto inline-flex">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-400 px-4 py-2 rounded-lg transition-all">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-400 px-4 py-2 rounded-lg transition-all">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            <span>Notifications</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-400 px-4 py-2 rounded-lg transition-all">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Security</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-400 px-4 py-2 rounded-lg transition-all">
                        <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            <span>Appearance</span>
                        </div>
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-indigo-500/20">
                                TS
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Taylan Sadan</h3>
                                <p className="text-gray-400">taylan@example.com</p>
                                <Button variant="secondary" size="sm" className="mt-3">
                                    Change Avatar
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Input
                                label="Full Name"
                                defaultValue="Taylan Sadan"
                                className="bg-black/20 border-white/10 focus:border-indigo-500/50"
                            />
                            <Input
                                label="Email Address"
                                defaultValue="taylan@example.com"
                                type="email"
                                className="bg-black/20 border-white/10 focus:border-indigo-500/50"
                            />
                            <Input
                                label="Job Title"
                                defaultValue="Senior Developer"
                                className="bg-black/20 border-white/10 focus:border-indigo-500/50"
                            />
                            <Input
                                label="Company"
                                defaultValue="Ayazma ONE"
                                className="bg-black/20 border-white/10 focus:border-indigo-500/50"
                            />
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                            <textarea
                                className="w-full h-32 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                                defaultValue="Building the future of AI agents."
                            />
                        </div>

                        <div className="mt-8 flex justify-end">
                            <GradientButton onClick={handleSave} isLoading={loading} icon={Save}>
                                Save Changes
                            </GradientButton>
                        </div>
                    </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-6">Email Notifications</h3>
                        <div className="space-y-4">
                            {[
                                'Weekly digest',
                                'New project updates',
                                'Agent run completions',
                                'Security alerts',
                                'Marketing emails'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-gray-300">{item}</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked={i < 3} />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 flex justify-end">
                            <GradientButton onClick={handleSave} isLoading={loading} icon={Save}>
                                Save Preferences
                            </GradientButton>
                        </div>
                    </div>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-6">Password & Authentication</h3>
                        <div className="space-y-6 max-w-md">
                            <Input
                                label="Current Password"
                                type="password"
                                className="bg-black/20 border-white/10 focus:border-indigo-500/50"
                            />
                            <Input
                                label="New Password"
                                type="password"
                                className="bg-black/20 border-white/10 focus:border-indigo-500/50"
                            />
                            <Input
                                label="Confirm New Password"
                                type="password"
                                className="bg-black/20 border-white/10 focus:border-indigo-500/50"
                            />
                            <Button variant="secondary">Update Password</Button>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <Button variant="danger" icon={Trash2}>
                            Delete Account
                        </Button>
                    </div>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-6">Theme Preferences</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <ThemeOption
                                theme="dark"
                                currentTheme={theme}
                                setTheme={setTheme}
                                label="Dark"
                                bgClass="bg-slate-900"
                            />
                            <ThemeOption
                                theme="light"
                                currentTheme={theme}
                                setTheme={setTheme}
                                label="Light"
                                bgClass="bg-white"
                            />
                            <ThemeOption
                                theme="system"
                                currentTheme={theme}
                                setTheme={setTheme}
                                label="System"
                                bgClass="bg-slate-800"
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    )
}

function ThemeOption({ theme, currentTheme, setTheme, label, bgClass }: { theme: string, currentTheme: string, setTheme: (t: any) => void, label: string, bgClass: string }) {
    const isActive = currentTheme === theme

    return (
        <div
            onClick={() => setTheme(theme)}
            className={`cursor-pointer group ${!isActive ? 'opacity-50 hover:opacity-100' : ''} transition-all`}
        >
            <div className={`aspect-video rounded-xl ${bgClass} border-2 ${isActive ? 'border-indigo-500' : 'border-transparent group-hover:border-gray-400'} mb-3 relative overflow-hidden shadow-lg`}>
                {isActive && (
                    <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                    </div>
                )}
            </div>
            <p className={`text-center font-medium ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{label}</p>
        </div>
    )
}

function CheckCircle2({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
