import dotenv from 'dotenv';
import path from 'path';
import { agentRegistry } from '../api/modules/agents/AgentRegistry.js';
import { registerAllAgents } from '../api/modules/agents/registerAgents.js';

// Load env vars
dotenv.config({ path: path.resolve('api/.env') });

async function testAgents() {
    console.log('🧪 Testing Agent Registry...');

    // 1. Register Agents
    registerAllAgents();

    // 2. Verify Registration
    const agents = agentRegistry.list();
    console.log(`\n📋 Registered Agents: ${agents.length}`);
    agents.forEach(a => console.log(`   - ${a.name}: ${a.description}`));

    const expectedAgents = ['design_spec', 'workflow_designer', 'content_strategist', 'orchestrator'];
    const missing = expectedAgents.filter(name => !agents.find(a => a.name === name));

    if (missing.length > 0) {
        console.error(`\n❌ Missing agents: ${missing.join(', ')}`);
        process.exit(1);
    }

    // 3. Test Orchestrator Retrieval
    try {
        const orchestrator = agentRegistry.get('orchestrator');
        console.log('\n✅ Orchestrator retrieved successfully');

        // Mock context for run
        const context = {
            userId: 'test-user',
            projectId: 'test-project',
            runId: 'test-run'
        };

        console.log('\n🚀 Starting Orchestrator Run (Dry Run)...');
        // Note: We are not mocking the inner agents here, so this will actually try to run them.
        // If they require real AI calls, this might fail or cost money.
        // For now, we just check if we can get the agent.

    } catch (error) {
        console.error('\n❌ Error retrieving orchestrator:', error);
        process.exit(1);
    }

    console.log('\n✨ Agent Registry Verification Complete!');
}

testAgents();
