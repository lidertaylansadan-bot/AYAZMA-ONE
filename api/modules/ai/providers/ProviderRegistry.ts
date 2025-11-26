import type { AiProvider } from './AiProvider.js'
import { OpenAiProvider } from './OpenAiProvider.js'
import { GeminiProvider } from './GeminiProvider.js'
import { OllamaProvider } from './OllamaProvider.js'
import { AppError } from '../../../core/app-error.js'

class ProviderRegistry {
  private providers = new Map<string, AiProvider>()

  register(provider: AiProvider) {
    this.providers.set(provider.name, provider)
  }

  get(name: string): AiProvider {
    const p = this.providers.get(name)
    if (!p) throw new AppError('AI_PROVIDER_NOT_FOUND', `AI provider ${name} not found`, 500)
    return p
  }

  list(): AiProvider[] {
    return Array.from(this.providers.values())
  }
}

const registry = new ProviderRegistry()
registry.register(new GeminiProvider())
registry.register(new OpenAiProvider())
registry.register(new OllamaProvider())

export const providerRegistry = registry