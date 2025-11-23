import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
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

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key (first 20 chars):', supabaseKey?.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    db: {
        schema: 'public'
    }
});

async function testDirectQuery() {
    console.log('\n=== Testing Direct Database Query ===\n');

    try {
        // Test 1: Simple select from projects (known working table)
        console.log('Test 1: Query projects table...');
        const { data: projects, error: projErr } = await supabase
            .from('projects')
            .select('id, name')
            .limit(1);

        if (projErr) {
            console.error('❌ Projects query failed:', projErr);
        } else {
            console.log('✅ Projects query succeeded:', projects?.length || 0, 'rows');
        }

        // Test 2: Try to query project_documents
        console.log('\nTest 2: Query project_documents table...');
        const { data: docs, error: docsErr } = await supabase
            .from('project_documents')
            .select('*')
            .limit(1);

        if (docsErr) {
            console.error('❌ project_documents query failed:', docsErr);
            console.error('Error details:', JSON.stringify(docsErr, null, 2));
        } else {
            console.log('✅ project_documents query succeeded:', docs?.length || 0, 'rows');
            if (docs && docs.length > 0) {
                console.log('Sample row:', docs[0]);
            }
        }

        // Test 3: Try to insert into project_documents
        console.log('\nTest 3: Insert into project_documents...');

        // First get a valid user
        const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers();
        if (userErr || !users || users.length === 0) {
            console.error('❌ Cannot get users:', userErr);
            return;
        }
        const userId = users[0].id;

        // Create a test project
        const { data: testProject, error: testProjErr } = await supabase
            .from('projects')
            .insert({
                name: 'Schema Test Project',
                description: 'Testing schema cache',
                sector: 'Technology',
                project_type: 'web_app',
                owner_id: userId
            })
            .select()
            .single();

        if (testProjErr) {
            console.error('❌ Failed to create test project:', testProjErr);
            return;
        }

        console.log('✅ Created test project:', testProject.id);

        // Now try to insert document
        const { data: testDoc, error: testDocErr } = await supabase
            .from('project_documents')
            .insert({
                project_id: testProject.id,
                title: 'Test Document',
                storage_path: 'test/path.pdf',
                mime_type: 'application/pdf',
                source_type: 'upload',
                processing_status: 'completed'
            })
            .select()
            .single();

        if (testDocErr) {
            console.error('❌ Failed to insert document:', testDocErr);
            console.error('Error details:', JSON.stringify(testDocErr, null, 2));
        } else {
            console.log('✅ Document inserted successfully:', testDoc.id);
        }

        // Cleanup
        await supabase.from('projects').delete().eq('id', testProject.id);
        console.log('✅ Cleaned up test project');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testDirectQuery();
