import type { AiRouterInput, AiRouterOutput } from '../types.js'

export interface AiProvider {
  name: string
  supportsTask(taskType: string): boolean
  call(input: AiRouterInput): Promise<AiRouterOutput>
}