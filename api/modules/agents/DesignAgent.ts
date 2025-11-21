import { BaseAgent } from './BaseAgent.js'
import type { AgentContext, AgentArtifactPayload } from './types.js'
import { routeAiRequest } from '../ai/aiRouter.js'
import { supabase } from '../../config/supabase.js'

export class DesignSpecAgent extends BaseAgent {
  constructor() {
    super('design_spec', 'Generates high-level app spec from project info and wizard answers')
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
    const prompt = `You are an expert product designer. Create a concise, actionable high-level app spec (markdown) for the following:
${projectInfo}${wizardInfo}
Include sections: Overview, Target Users, Core Features, Data Entities, Workflows, Monetization, Next Steps.`

    const ai = await routeAiRequest({ taskType: 'app_spec_suggestion', prompt, userId: context.userId, projectId: context.projectId, agentRunId: context.runId })
    const artifacts: AgentArtifactPayload[] = [
      { type: 'plan', title: 'High-Level App Spec', content: ai.text, meta: { provider: ai.provider, model: ai.model } },
      { type: 'log', title: 'AI Call Log', content: `Provider: ${ai.provider}\nModel: ${ai.model}`, meta: { } },
    ]
    return { artifacts }
  }
}