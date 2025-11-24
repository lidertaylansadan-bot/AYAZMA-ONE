// src/pages/api/admin/schema.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { generateCrudSpec, type ColumnDefinition } from '../../../utils/crudGenerator';

// Admin client uses the service role key (server‑side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, serviceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Get list of tables
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_schema')
            .neq('table_schema', 'pg_catalog')
            .neq('table_schema', 'information_schema')
            .neq('table_schema', 'storage') // Exclude storage schema
            .neq('table_schema', 'auth');   // Exclude auth schema

        if (tablesError) throw tablesError;

        // Get detailed columns for all tables
        const { data: columns, error: colsError } = await supabase
            .from('information_schema.columns')
            .select('table_name, column_name, data_type, is_nullable, column_default, character_maximum_length')
            .neq('table_schema', 'pg_catalog')
            .neq('table_schema', 'information_schema')
            .neq('table_schema', 'storage')
            .neq('table_schema', 'auth');

        if (colsError) throw colsError;

        // Group columns by table
        const columnsByTable: Record<string, ColumnDefinition[]> = {};
        columns?.forEach((c: any) => {
            if (!columnsByTable[c.table_name]) {
                columnsByTable[c.table_name] = [];
            }
            columnsByTable[c.table_name].push(c);
        });

        // Generate specs
        const schema: Record<string, any> = {};
        tables?.forEach((t: any) => {
            const tableName = t.table_name;
            const tableColumns = columnsByTable[tableName] || [];
            schema[tableName] = generateCrudSpec(tableName, tableColumns);
        });

        res.status(200).json({ schema });
    } catch (err: any) {
        console.error('Schema endpoint error:', err);
        res.status(500).json({ error: err.message || 'Unexpected error' });
    }
}
