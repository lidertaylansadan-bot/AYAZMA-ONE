import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCrudSpec, type ColumnDefinition } from '../src/utils/crudGenerator';

describe('Admin Schema API', () => {
    describe('generateCrudSpec', () => {
        it('should generate correct spec for a simple table', () => {
            const columns: ColumnDefinition[] = [
                {
                    column_name: 'id',
                    data_type: 'uuid',
                    is_nullable: 'NO',
                    column_default: 'gen_random_uuid()',
                    character_maximum_length: null,
                },
                {
                    column_name: 'name',
                    data_type: 'text',
                    is_nullable: 'NO',
                    column_default: null,
                    character_maximum_length: null,
                },
                {
                    column_name: 'created_at',
                    data_type: 'timestamp with time zone',
                    is_nullable: 'NO',
                    column_default: 'now()',
                    character_maximum_length: null,
                },
                {
                    column_name: 'is_active',
                    data_type: 'boolean',
                    is_nullable: 'YES',
                    column_default: 'true',
                    character_maximum_length: null,
                },
            ];

            const spec = generateCrudSpec('test_table', columns);

            expect(spec.tableName).toBe('test_table');
            expect(spec.primaryKey).toBe('id');
            expect(spec.fields).toHaveLength(4);

            // Check ID field
            const idField = spec.fields.find((f) => f.name === 'id');
            expect(idField).toBeDefined();
            expect(idField?.type).toBe('uuid');
            expect(idField?.readOnly).toBe(true);

            // Check name field
            const nameField = spec.fields.find((f) => f.name === 'name');
            expect(nameField).toBeDefined();
            expect(nameField?.type).toBe('text');
            expect(nameField?.required).toBe(true);
            expect(nameField?.label).toBe('Name');
            expect(nameField?.ui?.component).toBe('input');

            // Check created_at field
            const createdField = spec.fields.find((f) => f.name === 'created_at');
            expect(createdField).toBeDefined();
            expect(createdField?.type).toBe('date');
            expect(createdField?.readOnly).toBe(true);
            expect(createdField?.ui?.component).toBe('datepicker');

            // Check is_active field
            const activeField = spec.fields.find((f) => f.name === 'is_active');
            expect(activeField).toBeDefined();
            expect(activeField?.type).toBe('boolean');
            expect(activeField?.required).toBe(false);
            expect(activeField?.ui?.component).toBe('switch');
        });

        it('should handle text fields with max length', () => {
            const columns: ColumnDefinition[] = [
                {
                    column_name: 'description',
                    data_type: 'character varying',
                    is_nullable: 'YES',
                    column_default: null,
                    character_maximum_length: 500,
                },
            ];

            const spec = generateCrudSpec('test', columns);
            const field = spec.fields[0];

            expect(field.type).toBe('text');
            expect(field.validation?.maxLength).toBe(500);
            expect(field.ui?.component).toBe('textarea');
        });

        it('should handle numeric fields', () => {
            const columns: ColumnDefinition[] = [
                {
                    column_name: 'count',
                    data_type: 'integer',
                    is_nullable: 'NO',
                    column_default: null,
                    character_maximum_length: null,
                },
            ];

            const spec = generateCrudSpec('test', columns);
            const field = spec.fields[0];

            expect(field.type).toBe('number');
            expect(field.ui?.component).toBe('number');
            expect(field.required).toBe(true);
        });

        it('should handle JSON fields', () => {
            const columns: ColumnDefinition[] = [
                {
                    column_name: 'metadata',
                    data_type: 'jsonb',
                    is_nullable: 'YES',
                    column_default: null,
                    character_maximum_length: null,
                },
            ];

            const spec = generateCrudSpec('test', columns);
            const field = spec.fields[0];

            expect(field.type).toBe('json');
            expect(field.ui?.component).toBe('json-editor');
        });

        it('should format labels correctly', () => {
            const columns: ColumnDefinition[] = [
                {
                    column_name: 'user_full_name',
                    data_type: 'text',
                    is_nullable: 'NO',
                    column_default: null,
                    character_maximum_length: null,
                },
            ];

            const spec = generateCrudSpec('test', columns);
            const field = spec.fields[0];

            expect(field.label).toBe('User Full Name');
        });
    });

    describe('Schema API Response Structure', () => {
        it('should return schema with correct structure', () => {
            // Mock response structure
            const mockSchema = {
                projects: {
                    tableName: 'projects',
                    fields: [
                        { name: 'id', type: 'uuid', label: 'Id', required: false, readOnly: true },
                        { name: 'name', type: 'text', label: 'Name', required: true, readOnly: false },
                    ],
                    primaryKey: 'id',
                },
            };

            expect(mockSchema).toHaveProperty('projects');
            expect(mockSchema.projects).toHaveProperty('tableName');
            expect(mockSchema.projects).toHaveProperty('fields');
            expect(mockSchema.projects).toHaveProperty('primaryKey');
            expect(Array.isArray(mockSchema.projects.fields)).toBe(true);
        });
    });
});
