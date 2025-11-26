# Context Engine

The Context Engine is responsible for building optimized context for AI agents by gathering, prioritizing, and compressing relevant information.

## Overview

The Context Engine solves the challenge of providing AI agents with the right information while staying within token limits. It intelligently selects and compresses context based on relevance and priority.

## Architecture

```typescript
ContextEngineerService
├── buildContext()           // Main entry point
├── getProjectMetadata()     // Fetch project info
├── createDocumentSlices()   // RAG search results
├── getCompressedSegments()  // Pre-compressed context
├── getAgentHistory()        // Previous agent runs
├── prioritizeSlices()       // Token budget management
└── generatePrompts()        // Final prompt assembly
```

## Context Building Process

### 1. Permission Check

```typescript
if (agentName) {
  const hasAccess = await permissionService.checkAgentAccess(
    userId, 
    projectId, 
    agentName
  )
  if (!hasAccess) throw new AppError('PERMISSION_DENIED')
}
```

### 2. Gather Context Slices

#### Project Metadata

```typescript
{
  id: 'meta_project-123',
  type: 'project_meta',
  content: 'Project: My App\nDescription: ...',
  weight: 1.0  // Highest priority
}
```

#### RAG Search Results

```typescript
const ragResults = await ragService.search({
  projectId,
  query,
  limit: 5,
  threshold: 0.7
})
```

#### Agent History

```typescript
const history = await historyManager.getProjectHistory(projectId, 5)
// Returns previous agent actions for context continuity
```

### 3. Prioritize and Compress

```typescript
async prioritizeSlices(slices: ContextSlice[], maxTokens: number) {
  const sorted = slices.sort((a, b) => b.weight - a.weight)
  
  for (const slice of sorted) {
    if (currentTokens + sliceTokens <= maxTokens) {
      selected.push(slice)
    } else if (slice.weight > 0.4) {
      // Compress instead of drop
      const compressed = await contextCompressor.compress(
        slice.content,
        remainingTokens
      )
      selected.push({ ...slice, content: compressed })
    }
  }
}
```

## Context Compression

### When Compression Occurs

- Token budget exceeded
- Slice weight > 0.4 (moderately important)
- At least 100 tokens remaining

### Compression Strategy

```typescript
class ContextCompressor {
  async compress(text: string, maxTokens: number): Promise<string> {
    const prompt = `Summarize the following in ${maxTokens} tokens:
    
${text}

Summary:`
    
    const summary = await llm.invoke({ text, maxTokens })
    return `[COMPRESSED]: ${summary}`
  }
}
```

### Compression Model

- **Model**: GPT-4o-mini
- **Reason**: Cost-effective for summarization
- **Fallback**: Truncation if compression fails

## Context Slices

### Slice Structure

```typescript
interface ContextSlice {
  id: string
  type: ContextSourceType
  content: string
  weight: number  // 0.0 to 1.0
  sourceMeta?: {
    documentId?: string
    documentTitle?: string
    similarity?: number
    compressed?: boolean
  }
}
```

### Slice Types

- `project_meta` - Project information (weight: 1.0)
- `document` - RAG search results (weight: similarity score)
- `compressed_segment` - Pre-compressed context (weight: 0.8)
- `agent_history` - Previous agent runs (weight: 0.6)

## Token Management

### Token Estimation

```typescript
private estimateTokens(text: string): number {
  return Math.ceil(text.length * 0.25)  // ~4 chars per token
}
```

### Default Limits

- **Max Context Tokens**: 8,000
- **Reserve for Response**: ~2,000
- **Effective Limit**: 6,000 tokens

## Prompt Generation

### System Prompt

```typescript
`You are an AI assistant helping with a ${taskType} task for "${projectName}".

PROJECT CONTEXT:
${projectContext}

RELEVANT DOCUMENTS:
${documentContext}

Use the above context to provide accurate responses.`
```

### User Prompt

```typescript
userGoal || `Help me with ${taskType} for this project.`
```

## Usage Example

```typescript
import { contextEngineerService } from './modules/context-engineer/service'

const context = await contextEngineerService.buildContext({
  projectId: 'project-123',
  userId: 'user-456',
  taskType: 'design_spec',
  agentName: 'design_spec',
  query: 'Create a login page',
  maxTokens: 8000
})

// Use context with LLM
const response = await llm.chat({
  systemPrompt: context.systemPrompt,
  userPrompt: context.userPrompt
})
```

## Performance Optimization

### Caching

- Project metadata cached for 5 minutes
- RAG embeddings cached indefinitely
- Compressed segments pre-computed

### Lazy Loading

- Documents loaded only when needed
- History fetched on-demand
- Compression triggered only when necessary

## Monitoring

### Telemetry Events

```typescript
emitContextBuilt({
  projectId,
  userId,
  taskType,
  sliceCount: prioritizedSlices.length,
  totalTokens: estimatedTokens
})
```

### Metrics to Track

- Average context size
- Compression ratio
- Token usage per agent
- Cache hit rate

## Best Practices

1. **Set Appropriate Weights**
   - Critical info: 1.0
   - Important: 0.7-0.9
   - Supplementary: 0.4-0.6
   - Optional: < 0.4

2. **Optimize Queries**
   - Use specific search terms
   - Limit RAG results to 5-10
   - Filter by relevance threshold

3. **Monitor Token Usage**
   - Track compression frequency
   - Adjust maxTokens based on model
   - Pre-compress large documents

4. **Handle Errors Gracefully**
   - Fallback to truncation
   - Log compression failures
   - Return partial context if needed
