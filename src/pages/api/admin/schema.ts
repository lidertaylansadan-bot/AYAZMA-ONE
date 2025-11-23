// src/pages/api/admin/schema.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Admin client uses the service role key (server‑side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, serviceKey);

/**
 * Returns a simplified representation of the database schema.
 * For each table we list its columns with name and data type.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Get list of tables (excluding system schemas)
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_schema')
            .neq('table_schema', 'pg_catalog')
            .neq('table_schema', 'information_schema');

        if (tablesError) throw tablesError;

        // Get columns for all tables
        const { data: columns, error: colsError } = await supabase
            .from('information_schema.columns')
            .select('table_name, column_name, data_type')
            .neq('table_schema', 'pg_catalog')
            .neq('table_schema', 'information_schema');

        if (colsError) throw colsError;

        // Build schema object
        const schema: Record<string, any> = {};
        tables?.forEach((t: any) => {
            const name = t.table_name as string;
            schema[name] = { columns: [] };
        });
        columns?.forEach((c: any) => {
            const tbl = c.table_name as string;
            if (schema[tbl]) {
                schema[tbl].columns.push({ name: c.column_name, type: c.data_type });
            }
        });

        res.status(200).json({ schema });
    } catch (err: any) {
        console.error('Schema endpoint error:', err);
        res.status(500).json({ error: err.message || 'Unexpected error' });
    }
}
