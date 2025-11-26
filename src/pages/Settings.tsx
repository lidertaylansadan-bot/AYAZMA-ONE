/**
 * Settings Page
 * User settings and preferences
 */

import { Layout } from '../components/Layout'

export default function Settings() {
    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-gray-400 mt-1">
                        Manage your account settings and preferences
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* Profile Section */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
                        <p className="text-gray-400">
                            Profile settings will be available soon.
                        </p>
                    </div>

                    {/* Notifications Section */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>
                        <p className="text-gray-400">
                            Notification preferences will be available soon.
                        </p>
                    </div>

                    {/* Security Section */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Security</h2>
                        <p className="text-gray-400">
                            Security settings will be available soon.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
