import { BaseAgent } from './BaseAgent.js'
import type { AgentContext, AgentArtifactPayload } from './types.js'
import { routeAiRequest } from '../ai/aiRouter.js'
import { supabase } from '../../config/supabase.js'

export class ContentStrategistAgent extends BaseAgent {
  constructor() {
    super('content_strategist', 'Generates content strategy and example copy for the project')
  }

  async run(context: AgentContext): Promise<{ artifacts: AgentArtifactPayload[] }> {
    let projectInfo = ''
    if (context.projectId) {
      const { data } = await supabase
        .from('projects')
        .select('name, description, sector, project_type')
        .eq('id', context.projectId)
        .single()
      if (data) {
        projectInfo = `Project: ${data.name}\nSector: ${data.sector}\nType: ${data.project_type}\nDescription: ${data.description || ''}`
      }
    }
    const wizardInfo = context.wizardAnswers ? `\nWizard Answers:\n${JSON.stringify(context.wizardAnswers, null, 2)}` : ''
    const prompt = `You are an expert content strategist. Create a concise content strategy and sample copy pack.
Context:\n${projectInfo}${wizardInfo}
Provide:\n1) Content Strategy (channels: YouTube, IG, LinkedIn, Blog), tone & messaging pillars.\n2) Sample Copy Pack: landing page headline + subheadline, 3 short social posts, one email subject + body.
Format the output in markdown.`

    const ai = await routeAiRequest({ taskType: 'marketing_copy', prompt, userId: context.userId, projectId: context.projectId, agentRunId: context.runId })
    const artifacts: AgentArtifactPayload[] = [
      { type: 'plan', title: 'Content Strategy', content: ai.text, meta: { provider: ai.provider, model: ai.model } },
      { type: 'copy', title: 'Sample Copy Pack', content: ai.text, meta: { provider: ai.provider, model: ai.model } },
    ]
    return { artifacts }
  }
}