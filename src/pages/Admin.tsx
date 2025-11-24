// src/pages/Admin.tsx
import React from 'react';
import { SchemaProvider } from '../components/AdminPanel/SchemaProvider';
import { DynamicCrud } from '../components/AdminPanel/DynamicCrud';
import { themeCssVariables } from '../design/theme';

const Admin: React.FC = () => {
    return (
        <>
            {/* Inject theme variables */}
            <style>{themeCssVariables}</style>

            <div className="min-h-screen bg-[var(--color-bg-default)] text-[var(--color-text-primary)] font-sans">
                <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-paper)] px-6 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-[var(--color-primary-main)]">
                        AYAZMA-ONE Admin
                    </h1>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                        Auto-Generated Panel
                    </div>
                </header>

                <main>
                    <SchemaProvider>
                        <DynamicCrud />
                    </SchemaProvider>
                </main>
            </div>
        </>
    );
};

export default Admin;
