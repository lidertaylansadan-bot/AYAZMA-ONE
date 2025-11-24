// src/components/AdminPanel/DynamicCrud.tsx
import React, { useState, useEffect } from 'react';
import { useSchema } from './SchemaProvider';
import supabase from '../../utils/supabaseClient';
import type { CrudSpec, FieldSpec } from '../../utils/crudGenerator';

/**
 * Dynamic CRUD UI that adapts to the schema spec.
 */
export const DynamicCrud: React.FC = () => {
    const schema = useSchema();
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const activeSpec: CrudSpec | undefined = selectedTable ? schema[selectedTable] : undefined;

    const loadRows = async (table: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from(table).select('*').limit(50);
            if (error) throw error;
            setRows(data as any[]);
        } catch (e) {
            console.error('Failed to load rows for', table, e);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTableSelect = (table: string) => {
        setSelectedTable(table);
        loadRows(table);
    };

    if (!schema) return <div className="p-8 text-center text-gray-400">Loading schema metadata...</div>;

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[var(--color-border)] bg-[var(--color-bg-subtle)] overflow-y-auto">
                <div className="p-4 font-semibold text-[var(--color-text-secondary)] uppercase text-xs tracking-wider">
                    Tables
                </div>
                <ul>
                    {Object.keys(schema).map((tbl) => (
                        <li key={tbl}>
                            <button
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedTable === tbl
                                        ? 'bg-[var(--color-primary-main)] text-[var(--color-primary-contrast)] font-medium'
                                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-paper)]'
                                    }`}
                                onClick={() => handleTableSelect(tbl)}
                            >
                                {tbl}
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-col bg-[var(--color-bg-default)]">
                {activeSpec ? (
                    <>
                        <header className="px-6 py-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-paper)]">
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                                {activeSpec.tableName}
                            </h2>
                            <div className="text-sm text-[var(--color-text-secondary)]">
                                {rows.length} records loaded
                            </div>
                        </header>

                        <div className="flex-1 overflow-auto p-6">
                            {loading ? (
                                <div className="text-[var(--color-text-secondary)]">Loading data...</div>
                            ) : (
                                <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-[var(--color-border)]">
                                        <thead className="bg-[var(--color-bg-subtle)]">
                                            <tr>
                                                {activeSpec.fields.map((field) => (
                                                    <th
                                                        key={field.name}
                                                        className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider whitespace-nowrap"
                                                    >
                                                        {field.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[var(--color-bg-paper)] divide-y divide-[var(--color-border)]">
                                            {rows.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-[var(--color-bg-subtle)] transition-colors">
                                                    {activeSpec.fields.map((field) => (
                                                        <td
                                                            key={field.name}
                                                            className="px-4 py-3 text-sm text-[var(--color-text-primary)] whitespace-nowrap max-w-xs truncate"
                                                            title={String(row[field.name])}
                                                        >
                                                            <CellRenderer field={field} value={row[field.name]} />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {rows.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={activeSpec.fields.length}
                                                        className="px-4 py-8 text-center text-[var(--color-text-secondary)]"
                                                    >
                                                        No records found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-[var(--color-text-secondary)]">
                        Select a table to view its data
                    </div>
                )}
            </main>
        </div>
    );
};

const CellRenderer = ({ field, value }: { field: FieldSpec; value: any }) => {
    if (value === null || value === undefined) {
        return <span className="text-[var(--color-text-disabled)] italic">null</span>;
    }

    if (field.type === 'boolean') {
        return (
            <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${value
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
            >
                {value ? 'TRUE' : 'FALSE'}
            </span>
        );
    }

    if (field.type === 'date') {
        return <span>{new Date(value).toLocaleString()}</span>;
    }

    if (field.type === 'json') {
        return <span className="font-mono text-xs text-blue-400">{JSON.stringify(value).slice(0, 30)}...</span>;
    }

    return <span>{String(value)}</span>;
};
