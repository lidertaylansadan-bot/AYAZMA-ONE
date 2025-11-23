// src/components/AdminPanel/DynamicCrud.tsx
import React, { useState } from 'react';
import { useSchema, type TableSchema } from './SchemaProvider';
import supabase from '../../utils/supabaseClient';

/**
 * Simple dynamic CRUD UI based on the provided table schema.
 * For each table we fetch rows (limited to 20) and display them in a table.
 * Editing/creating/deleting is left as placeholders – the UI shows the
 * structure and can be extended later.
 */
export const DynamicCrud: React.FC = () => {
    const schema = useSchema();
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [rows, setRows] = useState<any[]>([]);

    const loadRows = async (table: string) => {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(20);
            if (error) throw error;
            setRows(data as any[]);
        } catch (e) {
            console.error('Failed to load rows for', table, e);
            setRows([]);
        }
    };

    const handleTableSelect = (table: string) => {
        setSelectedTable(table);
        loadRows(table);
    };

    if (!schema) return <div className="p-4">Loading schema…</div>;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
            <div className="flex">
                {/* Table list */}
                <aside className="w-1/4 pr-4 border-r">
                    <ul>
                        {Object.keys(schema).map((tbl) => (
                            <li key={tbl} className="mb-2">
                                <button
                                    className={`text-left w-full py-1 px-2 rounded ${selectedTable === tbl ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'}`}
                                    onClick={() => handleTableSelect(tbl)}
                                >
                                    {tbl}
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>
                {/* Data view */}
                <section className="flex-1 pl-4">
                    {selectedTable ? (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">{selectedTable}</h3>
                            <table className="min-w-full border border-gray-600">
                                <thead className="bg-gray-800">
                                    <tr>
                                        {(schema[selectedTable] as TableSchema).columns.map((col) => (
                                            <th key={col.name} className="px-2 py-1 text-left border-b border-gray-600">
                                                {col.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, idx) => (
                                        <tr key={idx} className="odd:bg-gray-900 even:bg-gray-800">
                                            {(schema[selectedTable] as TableSchema).columns.map((col) => (
                                                <td key={col.name} className="px-2 py-1 border-b border-gray-600">
                                                    {String(row[col.name])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p>Select a table from the left to view its data.</p>
                    )}
                </section>
            </div>
        </div>
    );
};
