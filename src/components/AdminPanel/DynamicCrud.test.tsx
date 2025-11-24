import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DynamicCrud } from './DynamicCrud';
import type { CrudSpec } from '../../utils/crudGenerator';
import React from 'react';

// Mock supabase client
vi.mock('../../utils/supabaseClient', () => ({
    default: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
        })),
    },
}));

const mockSchema: Record<string, CrudSpec> = {
    projects: {
        tableName: 'projects',
        primaryKey: 'id',
        fields: [
            {
                name: 'id',
                type: 'uuid',
                label: 'Id',
                required: false,
                readOnly: true,
                ui: { component: 'input', hidden: true },
            },
            {
                name: 'name',
                type: 'text',
                label: 'Name',
                required: true,
                readOnly: false,
                ui: { component: 'input' },
            },
            {
                name: 'status',
                type: 'text',
                label: 'Status',
                required: false,
                readOnly: false,
                ui: { component: 'input' },
            },
            {
                name: 'created_at',
                type: 'date',
                label: 'Created At',
                required: false,
                readOnly: true,
                ui: { component: 'datepicker' },
            },
        ],
    },
};

// Mock the useSchema hook to return our mock schema
vi.mock('./SchemaProvider', () => ({
    SchemaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSchema: () => mockSchema,
}));

describe('DynamicCrud Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders table list with mocked schema', async () => {
        render(<DynamicCrud />);

        // Schema should be immediately available due to mock
        await waitFor(() => {
            expect(screen.getByText('projects')).toBeInTheDocument();
        });
    });

    it('renders correct field labels for selected table', async () => {
        render(<DynamicCrud />);

        // Wait for and click projects
        const projectsButton = await screen.findByText('projects');
        projectsButton.click();

        // Wait for table headers to appear
        await waitFor(() => {
            expect(screen.getByText('Name')).toBeInTheDocument();
            expect(screen.getByText('Status')).toBeInTheDocument();
            expect(screen.getByText('Created At')).toBeInTheDocument();
        });
    });

    it('displays "Select a table" message initially', async () => {
        render(<DynamicCrud />);

        await waitFor(() => {
            expect(screen.getByText(/Select a table to view its data/i)).toBeInTheDocument();
        });
    });

    it('matches snapshot for initial state', async () => {
        const { container } = render(<DynamicCrud />);

        await waitFor(() => {
            expect(screen.getByText('projects')).toBeInTheDocument();
        });

        expect(container).toMatchSnapshot();
    });
});
