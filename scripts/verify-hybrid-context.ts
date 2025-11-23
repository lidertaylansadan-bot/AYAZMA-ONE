import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { contextEngineerService } from '../api/modules/context-engineer/service';
import { logger } from '../api/core/logger';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    console.log('Starting Hybrid Context Verification...');

    let projectId: string | null = null;
    let documentId: string | null = null;
    let viewId: string | null = null;

    try {
        // Get a valid user ID
        const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers();
        if (userErr || !users || users.length === 0) {
            throw new Error('No users found to assign project to');
        }
        const userId = users[0].id;
        console.log(`Using user ID: ${userId}`);

        // Debug: List tables
        const { data: tables, error: tableErr } = await supabase
            .rpc('list_tables_debug'); // This won't work unless I create the function.

        // Try querying a known table to see if connection is good
        const { data: projectsTest, error: projTestErr } = await supabase.from('projects').select('id').limit(1);
        if (projTestErr) console.error('Error querying projects:', projTestErr);
        else console.log('Projects table accessible');

        // Try querying project_documents directly to see error
        const { error: docTestErr } = await supabase.from('project_documents').select('id').limit(1);
        if (docTestErr) console.error('Error querying project_documents:', docTestErr);
        const { data: project, error: projErr } = await supabase
            .from('projects')
            .insert({
                name: 'Hybrid Context Test Project',
                description: 'Test project for hybrid context verification',
                sector: 'Technology',
                project_type: 'web_app', // 'Test' is not in allowed values ('saas', 'web_app', 'mobile_app', 'media', 'hybrid')
                owner_id: userId
            })
            .select()
            .single();

        if (projErr) throw new Error(`Failed to create project: ${projErr.message}`);
        projectId = project.id;
        console.log(`Created project: ${projectId}`);

        // 2. Create Test Document
        const { data: doc, error: docErr } = await supabase
            .from('project_documents')
            .insert({
                project_id: projectId,
                title: 'Test Document.pdf',
                storage_path: 'test/path.pdf',
                mime_type: 'application/pdf',
                source_type: 'upload',
                processing_status: 'completed'
            })
            .select()
            .single();

        if (docErr) throw new Error(`Failed to create document: ${docErr.message}`);
        documentId = doc.id;
        console.log(`Created document: ${documentId}`);

        // 3. Create Compressed View
        const { data: view, error: viewErr } = await supabase
            .from('document_compressed_views')
            .insert({
                document_id: documentId,
                compression_strategy: 'text_only',
                model_name: 'test-model',
                raw_token_count: 100,
                compressed_token_count: 50,
                token_saving_estimate: 0.5,
                processing_time_ms: 100
            })
            .select()
            .single();

        if (viewErr) throw new Error(`Failed to create compressed view: ${viewErr.message}`);
        viewId = view.id;
        console.log(`Created compressed view: ${viewId}`);

        // 4. Create Compressed Segment
        const { error: segErr } = await supabase
            .from('document_compressed_segments')
            .insert({
                compressed_view_id: viewId,
                segment_index: 0,
                segment_type: 'text',
                payload: {
                    summary: 'This is a compressed summary of the test document.',
                    keyPoints: ['Point 1', 'Point 2']
                },
                estimated_tokens: 50
            });

        if (segErr) throw new Error(`Failed to create segment: ${segErr.message}`);
        console.log('Created compressed segment');

        // 5. Test Context Build (Hybrid)
        console.log('Building hybrid context...');
        const context = await contextEngineerService.buildContext({
            projectId: projectId!,
            taskType: 'general',
            userGoal: 'What is in the test document?',
            contextStrategy: 'hybrid'
        });

        // 6. Verify Results
        console.log('Context built. Verifying slices...');
        const hasProjectMeta = context.contextSlices.some(s => s.type === 'project_meta');
        const hasCompressedSegment = context.contextSlices.some(s => s.type === 'compressed_segment');

        console.log(`Has Project Meta: ${hasProjectMeta}`);
        console.log(`Has Compressed Segment: ${hasCompressedSegment}`);

        if (hasProjectMeta && hasCompressedSegment) {
            console.log('SUCCESS: Hybrid context verification passed!');
        } else {
            console.error('FAILURE: Missing expected context slices.');
            console.log('Slices:', JSON.stringify(context.contextSlices, null, 2));
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Cleanup
        if (projectId) {
            console.log('Cleaning up...');
            // Deleting project should cascade delete documents, views, segments
            await supabase.from('projects').delete().eq('id', projectId);
        }
    }
}

runTest();
