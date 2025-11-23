// src/components/AdminPanel/SchemaProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type TableSchema = {
    columns: { name: string; type: string }[];
};
export type DatabaseSchema = Record<string, TableSchema>;

const SchemaContext = createContext<DatabaseSchema | null>(null);

export const useSchema = () => {
    const ctx = useContext(SchemaContext);
    if (!ctx) throw new Error('SchemaProvider not found');
    return ctx;
};

interface Props {
    children: ReactNode;
}

export const SchemaProvider = ({ children }: Props) => {
    const [schema, setSchema] = useState<DatabaseSchema | null>(null);

    useEffect(() => {
        fetch('/api/admin/schema')
            .then((res) => res.json())
            .then((data) => setSchema(data.schema))
            .catch((err) => console.error('Failed to load schema', err));
    }, []);

    return <SchemaContext.Provider value={schema}>{children}</SchemaContext.Provider>;
};
