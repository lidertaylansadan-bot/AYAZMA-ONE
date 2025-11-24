// src/utils/crudGenerator.ts

export interface ColumnDefinition {
    column_name: string;
    data_type: string;
    is_nullable: string; // 'YES' | 'NO'
    column_default: string | null;
    character_maximum_length: number | null;
}

export interface FieldSpec {
    name: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'json' | 'uuid' | 'unknown';
    label: string;
    required: boolean;
    readOnly: boolean;
    defaultValue?: any;
    validation?: {
        maxLength?: number;
    };
    ui?: {
        component: 'input' | 'textarea' | 'number' | 'switch' | 'datepicker' | 'json-editor';
        hidden?: boolean;
    };
}

export interface CrudSpec {
    tableName: string;
    fields: FieldSpec[];
    primaryKey: string; // assuming single PK for now
}

/**
 * Generates a rich CRUD specification from raw database column metadata.
 */
export function generateCrudSpec(tableName: string, columns: ColumnDefinition[]): CrudSpec {
    const fields: FieldSpec[] = columns.map((col) => {
        const isId = col.column_name === 'id';
        const isCreated = col.column_name === 'created_at';
        const isUpdated = col.column_name === 'updated_at';

        // Infer type
        let type: FieldSpec['type'] = 'unknown';
        let component: FieldSpec['ui']['component'] = 'input';

        switch (col.data_type) {
            case 'uuid':
                type = 'uuid';
                break;
            case 'text':
            case 'character varying':
                type = 'text';
                component = (col.character_maximum_length && col.character_maximum_length > 255) ? 'textarea' : 'input';
                break;
            case 'integer':
            case 'bigint':
            case 'numeric':
                type = 'number';
                component = 'number';
                break;
            case 'boolean':
                type = 'boolean';
                component = 'switch';
                break;
            case 'timestamp with time zone':
            case 'timestamp without time zone':
            case 'date':
                type = 'date';
                component = 'datepicker';
                break;
            case 'json':
            case 'jsonb':
                type = 'json';
                component = 'json-editor';
                break;
        }

        const isReadOnly = isId || isCreated || isUpdated; // Simple heuristic

        return {
            name: col.column_name,
            label: formatLabel(col.column_name),
            type,
            required: col.is_nullable === 'NO' && !col.column_default, // Required if not nullable and no default
            readOnly: isReadOnly,
            defaultValue: col.column_default,
            validation: {
                maxLength: col.character_maximum_length || undefined,
            },
            ui: {
                component,
                hidden: isId && tableName !== 'users', // Hide ID usually, unless specific cases
            },
        };
    });

    return {
        tableName,
        fields,
        primaryKey: 'id', // Default assumption
    };
}

function formatLabel(key: string): string {
    return key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
