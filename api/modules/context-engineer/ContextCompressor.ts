import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { logger } from "../../core/logger.js"
import { config } from "../../core/config.js"

export class ContextCompressor {
    private model: ChatOpenAI

    constructor() {
        this.model = new ChatOpenAI({
            modelName: "gpt-4o-mini", // Use a cheaper/faster model for compression
            temperature: 0,
            openAIApiKey: config.aiOpenaiKey,
        })
    }

    /**
     * Compresses text to approximately fit within maxTokens.
     * Uses a summarization chain.
     */
    async compress(text: string, maxTokens: number): Promise<string> {
        try {
            // Simple heuristic: if text is already short enough, return it
            // Assuming ~4 chars per token
            if (text.length / 4 <= maxTokens) {
                return text
            }

            const prompt = PromptTemplate.fromTemplate(
                `Summarize the following text to capture the key information relevant to a software development task. 
                Keep the summary concise (approx {maxTokens} tokens).
                
                TEXT:
                {text}
                
                SUMMARY:`
            )

            const chain = prompt.pipe(this.model).pipe(new StringOutputParser())

            const summary = await chain.invoke({
                text: text,
                maxTokens: maxTokens
            })

            return `[COMPRESSED]: ${summary}`
        } catch (error) {
            logger.error({ err: error }, "Context compression failed")
            // Fallback: Truncate
            return text.slice(0, maxTokens * 4) + "... [Truncated]"
        }
    }
}

export const contextCompressor = new ContextCompressor()
