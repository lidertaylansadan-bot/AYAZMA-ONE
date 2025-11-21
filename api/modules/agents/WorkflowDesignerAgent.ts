import { BaseAgent } from './BaseAgent.js'
import type { AgentContext, AgentArtifactPayload } from './types.js'
import { routeAiRequest } from '../ai/aiRouter.js'
import { supabase } from '../../config/supabase.js'

export class WorkflowDesignerAgent extends BaseAgent {
  constructor() {
    super('workflow_designer', 'Designs key workflows and automations for a project')
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
    const prompt = `You are an expert SaaS workflow and automation designer. For this project, design the key workflows and automations.
Context:\n${projectInfo}${wizardInfo}
Include sections: Events/Triggers, Actions, Integrations (email, webhooks, CRM, billing), Error handling, Monitoring suggestions, and Implementation tasks as bullet list.`

    const ai = await routeAiRequest({ taskType: 'workflow_suggestion', prompt, userId: context.userId, projectId: context.projectId, agentRunId: context.runId })
    const artifacts: AgentArtifactPayload[] = [
      { type: 'plan', title: 'Workflow Plan', content: ai.text, meta: { provider: ai.provider, model: ai.model } },
    ]
    return { artifacts }
  }
}