import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { DesignSpecAgent } from '../api/modules/agents/DesignAgent.js'
import { WorkflowDesignerAgent } from '../api/modules/agents/WorkflowDesignerAgent.js'
import { ContentStrategistAgent } from '../api/modules/agents/ContentStrategistAgent.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const apiEnvPath = path.join(__dirname, '../api/.env')
const rootEnvPath = path.join(__dirname, '../.env')

console.log('Checking env files:')
console.log(`- API .env: ${apiEnvPath} (${fs.existsSync(apiEnvPath) ? 'Exists' : 'Missing'})`)
console.log(`- Root .env: ${rootEnvPath} (${fs.existsSync(rootEnvPath) ? 'Exists' : 'Missing'})`)

dotenv.config({ path: apiEnvPath })
dotenv.config({ path: rootEnvPath })

console.log('Loaded Environment Variables:', Object.keys(process.env).filter(k => k.startsWith('SUPABASE')))

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWithRealData() {
    console.log('🔍 Fetching real projects from Supabase...\n')

    // Get real projects
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1)
        .order('created_at', { ascending: false })

    if (error || !projects || projects.length === 0) {
        console.log('⚠️  No projects found in database. Creating a test project...\n')

        // Create a test project
        const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert([{
                name: 'AI SaaS Platform Test',
                description: 'A SaaS platform for AI-powered business automation',
                sector: 'saas',
                project_type: 'saas',
                status: 'draft'
            }])
            .select()
            .single()

        if (createError || !newProject) {
            console.error('❌ Failed to create test project:', createError)
            return
        }

        console.log('✅ Created test project:', newProject.name, '\n')
        await testAgents(newProject)
    } else {
        console.log('✅ Found existing project:', projects[0].name, '\n')
        await testAgents(projects[0])
    }
}

async function testAgents(project: any) {
    const context = {
        userId: project.user_id || 'test-user',
        projectId: project.id,
        runId: `real-data-test-${Date.now()}`,
        wizardAnswers: {
            projectName: project.name,
            sector: project.sector,
            projectType: project.project_type,
            description: project.description
        }
    }

    console.log('📋 Testing with project:', project.name)
    console.log('   ID:', project.id)
    console.log('   Sector:', project.sector)
    console.log('   Type:', project.project_type)
    console.log('')

    // Test Design Agent
    console.log('🎨 Testing DesignSpecAgent...')
    try {
        const designAgent = new DesignSpecAgent()
        const designResult = await designAgent.run(context)
        console.log('✅ DesignSpecAgent completed')
        console.log('   Artifacts:', designResult.artifacts.length)
        console.log('   Provider:', designResult.artifacts[0]?.meta?.provider)
        console.log('   Model:', designResult.artifacts[0]?.meta?.model)
        console.log('')
    } catch (error) {
        console.error('❌ DesignSpecAgent failed:', error)
        console.log('')
    }

    // Test Workflow Agent
    console.log('⚙️  Testing WorkflowDesignerAgent...')
    try {
        const workflowAgent = new WorkflowDesignerAgent()
        const workflowResult = await workflowAgent.run(context)
        console.log('✅ WorkflowDesignerAgent completed')
        console.log('   Artifacts:', workflowResult.artifacts.length)
        console.log('   Provider:', workflowResult.artifacts[0]?.meta?.provider)
        console.log('   Model:', workflowResult.artifacts[0]?.meta?.model)
        console.log('')
    } catch (error) {
        console.error('❌ WorkflowDesignerAgent failed:', error)
        console.log('')
    }

    // Test Content Agent
    console.log('📝 Testing ContentStrategistAgent...')
    try {
        const contentAgent = new ContentStrategistAgent()
        const contentResult = await contentAgent.run(context)
        console.log('✅ ContentStrategistAgent completed')
        console.log('   Artifacts:', contentResult.artifacts.length)
        console.log('   Provider:', contentResult.artifacts[0]?.meta?.provider)
        console.log('   Model:', contentResult.artifacts[0]?.meta?.model)
        console.log('')
    } catch (error) {
        console.error('❌ ContentStrategistAgent failed:', error)
        console.log('')
    }

    console.log('🎉 Real data testing complete!')
}

testWithRealData().catch(console.error)
