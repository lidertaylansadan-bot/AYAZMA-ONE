# Long-Context & Optical Compression Architecture

## Document Version

- **Version**: 1.0
- **Last Updated**: 2025-11-23
- **Author**: AYAZMA-ONE Team

---

## 1. Executive Summary

This document defines the architecture for AYAZMA-ONE's Long-Context Engine and Optical Compression system (Stage 4). The system extends the existing RAG foundation (Stage 2) to handle long documents, scanned PDFs, and image-based content efficiently through:

1. **OCR Pipeline**: Extract text from scanned/image-based documents
2. **Optical Compression**: Reduce token usage while preserving critical information
3. **Hybrid Context System**: Intelligently combine compressed and raw context
4. **Cost Optimization**: Track and minimize LLM API costs

---

## 2. Current State: RAG Foundation (Stage 2)

### 2.1 Architecture Overview

```
┌─────────────┐
│   Upload    │
│  Document   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Extract   │  ← PDF/DOCX/TXT text extraction
│    Text     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Chunking  │  ← 800 tokens, 15% overlap
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Embedding  │  ← Gemini text-embedding-004 (768 dims)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Storage   │  ← project_document_chunks + pgvector
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ RAG Search  │  ← Cosine similarity, top-N retrieval
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Context    │  ← Gather, prioritize, generate prompts
│  Engineer   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Agent     │  ← Execute with enriched context
└─────────────┘
```

### 2.2 Database Schema

**Tables**:

- `project_documents`: Document metadata
- `project_document_chunks`: Text chunks with embeddings
- `agent_context_usages`: Context usage tracking

**Key Features**:

- pgvector for similarity search
- HNSW index for performance
- RLS for security

### 2.3 Limitations

❌ **Cannot handle**:

- Scanned PDFs without OCR
- Very long documents (>100 pages) efficiently
- Image-heavy documents
- Cost-sensitive scenarios requiring compression

---

## 3. Target State: Optical Compression Layer

### 3.1 Enhanced Architecture

```
┌─────────────┐
│   Upload    │
│  Document   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  OCR Check  │  ← Is document scanned/image-based?
└──┬────────┬─┘
   │        │
   │ Yes    │ No
   ▼        ▼
┌──────┐ ┌──────────┐
│ OCR  │ │ Extract  │
│Engine│ │   Text   │
└──┬───┘ └────┬─────┘
   │          │
   └────┬─────┘
        │
        ▼
┌─────────────┐
│  Chunking   │  ← 800 tokens, 15% overlap
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Embedding  │  ← Gemini text-embedding-004
└──────┬──────┘
       │
       ▼
┌──────┴──────┐
│             │
▼             ▼
┌──────────┐ ┌────────────────┐
│   Raw    │ │   Optical      │
│  Chunks  │ │  Compression   │
│          │ │                │
│ Storage  │ │ ┌────────────┐ │
│          │ │ │ Text-Only  │ │
│          │ │ │Compression │ │
│          │ │ └────────────┘ │
│          │ │ ┌────────────┐ │
│          │ │ │  Vision    │ │
│          │ │ │Compression │ │
│          │ │ └────────────┘ │
└────┬─────┘ └───────┬────────┘
     │               │
     │               ▼
     │      ┌────────────────┐
     │      │  Compressed    │
     │      │   Segments     │
     │      │   Storage      │
     │      └───────┬────────┘
     │              │
     └──────┬───────┘
            │
            ▼
┌─────────────────────┐
│  Context Engineer   │
│   (Hybrid Mode)     │
│                     │
│ Strategy:           │
│ • raw_only          │
│ • compressed_only   │
│ • hybrid            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      Agent          │
└─────────────────────┘
```

### 3.2 Key Components

#### 3.2.1 OCR Engine

**Purpose**: Extract text from scanned/image-based documents

**Options**:

1. **Tesseract OCR** (Local)
   - Free, privacy-friendly
   - Lower accuracy (~85-90%)
   - Slower processing

2. **Cloud OCR** (Google Vision, Azure)
   - High accuracy (>95%)
   - API costs
   - Faster processing

**Process**:

```
PDF → Page Images → OCR → Text + Confidence → Chunks
```

#### 3.2.2 Optical Compression Service

**Purpose**: Reduce token usage while preserving information

**Interface**:

```typescript
interface OpticalCompressionService {
  compress(input: CompressionInput): Promise<CompressionResult>
}
```

**Strategies**:

**A. Text-Only Compression**

- Use LLM to summarize and condense
- Extract key points, remove redundancy
- Target: 40-60% token reduction
- Best for: Text-heavy documents

**B. Vision-Based Compression**

- Combine text + visual understanding
- Preserve layout, diagrams, tables
- Target: 50-70% token reduction
- Best for: Mixed content documents

**C. Hybrid Compression**

- Adaptive strategy based on content
- Text-only for prose
- Vision for complex layouts
- Target: 45-65% token reduction

#### 3.2.3 Compressed Storage

**Tables**:

- `document_compressed_views`: Compression metadata
- `document_compressed_segments`: Compressed content

**Benefits**:

- Multiple compression strategies per document
- Version history
- A/B testing different approaches

---

## 4. Hybrid Context Strategy

### 4.1 Context Modes

#### Mode 1: Raw Only

```
Use Case: Legal documents, contracts, precise analysis
Flow: RAG Search → Raw Chunks → Context
Pros: Maximum accuracy, no information loss
Cons: High token usage, higher cost
```

#### Mode 2: Compressed Only

```
Use Case: Summaries, overviews, general questions
Flow: Compressed Segments → Context
Pros: Low token usage, fast, cheap
Cons: Potential information loss
```

#### Mode 3: Hybrid (Recommended)

```
Use Case: Most scenarios
Flow: 
  1. Compressed Segments (70% of budget)
  2. Raw Chunks for details (30% of budget)
  3. Combine and prioritize
Pros: Balanced cost/quality
Cons: More complex logic
```

### 4.2 Selection Logic

```typescript
function selectContextMode(task: AgentTask): ContextMode {
  // High-precision tasks
  if (task.requiresExactQuotes || task.isLegal) {
    return 'raw_only'
  }
  
  // Summary/overview tasks
  if (task.isSummary || task.isOverview) {
    return 'compressed_only'
  }
  
  // Default: hybrid
  return 'hybrid'
}
```

### 4.3 Agent Preferences

Agents can specify compression preferences:

```typescript
class DesignSpecAgent extends BaseAgent {
  constructor() {
    super('design_spec', 'description', {
      needsContext: true,
      contextTaskType: 'design_spec',
      contextStrategy: 'hybrid', // NEW
      compressionPreference: 'balanced' // 'speed' | 'quality' | 'balanced'
    })
  }
}
```

---

## 5. Data Flow Diagrams

### 5.1 Document Upload & Processing

```
User Upload
    │
    ▼
┌─────────────────────┐
│ Validate & Store    │
│ (Supabase Storage)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Check Document Type │
└──┬────────────────┬─┘
   │                │
   │ Scanned/Image  │ Text-based
   ▼                ▼
┌──────────┐    ┌──────────┐
│   OCR    │    │ Extract  │
│ Pipeline │    │   Text   │
└────┬─────┘    └────┬─────┘
     │               │
     └───────┬───────┘
             │
             ▼
┌─────────────────────┐
│  Text Chunking      │
│  (800 tokens, 15%)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Generate Embeddings│
│  (Gemini 768-dim)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Save Raw Chunks     │
│ (project_document_  │
│  chunks)            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Enqueue Compression │
│ Job (Background)    │
└─────────────────────┘
```

### 5.2 Compression Job Flow

```
Compression Job Start
    │
    ▼
┌─────────────────────┐
│ Load Document Chunks│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Select Compression  │
│ Strategy            │
└──┬────────────────┬─┘
   │                │
   │ Text-Only      │ Optical
   ▼                ▼
┌──────────┐    ┌──────────┐
│   LLM    │    │  Vision  │
│Summarize │    │  Model   │
└────┬─────┘    └────┬─────┘
     │               │
     └───────┬───────┘
             │
             ▼
┌─────────────────────┐
│ Create Compressed   │
│ Segments            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Calculate Metrics   │
│ (token savings,     │
│  processing time)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Save to DB          │
│ (compressed_views,  │
│  compressed_segments│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Emit Telemetry      │
│ Event               │
└─────────────────────┘
```

### 5.3 Hybrid Context Building

```
Agent Run Start
    │
    ▼
┌─────────────────────┐
│ Context Engineer    │
│ buildContext()      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Determine Strategy  │
│ (raw/compressed/    │
│  hybrid)            │
└──┬────────────────┬─┘
   │                │
   │ Hybrid         │
   ▼                │
┌──────────┐        │
│ Get      │        │
│Compressed│        │
│Segments  │        │
│(70%)     │        │
└────┬─────┘        │
     │              │
     ▼              │
┌──────────┐        │
│ Get Raw  │        │
│ Chunks   │        │
│ via RAG  │        │
│ (30%)    │        │
└────┬─────┘        │
     │              │
     └──────┬───────┘
            │
            ▼
┌─────────────────────┐
│ Combine & Prioritize│
│ by Weight           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Fit to Token Budget │
│ (8K tokens)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Generate System &   │
│ User Prompts        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Inject to Agent     │
│ Context             │
└─────────────────────┘
```

---

## 6. Model Abstraction

### 6.1 Compression Provider Interface

```typescript
export interface OpticalCompressionService {
  /**
   * Compress document chunks into compact segments
   */
  compress(input: CompressionInput): Promise<CompressionResult>
  
  /**
   * Estimate token count for text
   */
  estimateTokens(text: string): number
}

export interface CompressionInput {
  documentId: string
  chunks: DocumentChunk[]
  strategy: CompressionStrategy
  targetTokenBudget?: number
}

export interface CompressionResult {
  modelName: string
  strategy: CompressionStrategy
  segments: CompressionSegment[]
  rawTokenCount: number
  compressedTokenCount: number
  tokenSavingEstimate: number
  processingTimeMs: number
}
```

### 6.2 Implementation Strategy

**Phase 1**: Text-Only Compression

- Use existing LLM (GPT-4o-mini, Gemini)
- Summarization prompts
- Simple, fast, cost-effective

**Phase 2**: Vision-Based Compression

- Add vision models (GPT-4o, Gemini Pro Vision)
- Process page images
- Extract visual information

**Phase 3**: Custom Models

- Fine-tuned compression models
- Domain-specific optimization
- Maximum efficiency

### 6.3 Provider Registry

```typescript
class CompressionProviderRegistry {
  private providers = new Map<CompressionStrategy, OpticalCompressionService>()
  
  register(strategy: CompressionStrategy, provider: OpticalCompressionService) {
    this.providers.set(strategy, provider)
  }
  
  get(strategy: CompressionStrategy): OpticalCompressionService {
    const provider = this.providers.get(strategy)
    if (!provider) throw new Error(`No provider for strategy: ${strategy}`)
    return provider
  }
}
```

---

## 7. Integration Points

### 7.1 With Existing RAG System

**Coexistence**:

- Raw chunks remain in `project_document_chunks`
- Compressed segments in new tables
- Both accessible to Context Engineer
- No breaking changes to existing agents

**Migration Path**:

- Existing documents continue to work
- Compression is opt-in
- Gradual rollout per project/document

### 7.2 With Context Engineer

**Enhanced Input**:

```typescript
interface ContextEngineerInput {
  // Existing fields
  projectId: string
  taskType: TaskType
  userGoal?: string
  maxTokens?: number
  includeHistory?: boolean
  
  // NEW fields
  contextStrategy?: 'raw_only' | 'compressed_only' | 'hybrid'
  compressionPreference?: 'speed' | 'quality' | 'balanced'
}
```

**Enhanced Output**:

```typescript
interface ContextSlice {
  id: string
  type: 'project_meta' | 'document' | 'agent_history'
  content: string
  weight: number
  sourceMeta: {
    source: 'raw_chunk' | 'compressed_segment' // NEW
    compressionStrategy?: CompressionStrategy
    documentId?: string
    chunkId?: string
    segmentId?: string
    similarity?: number
  }
}
```

### 7.3 With Agent Runner

**No Changes Required**:

- Agents receive context via `context.extra.contextEngineer`
- Format remains the same
- Compression is transparent to agents

**Optional Enhancements**:

- Agents can specify compression preferences
- Agents can access compression metadata

---

## 8. Cost & Performance Considerations

### 8.1 Cost Analysis

**Scenario**: 100-page PDF document

**Without Compression**:

- Chunks: ~125 chunks × 800 tokens = 100,000 tokens
- RAG retrieval: Top 10 chunks = 8,000 tokens
- Agent run cost: ~$0.02 (GPT-4o-mini)

**With Compression** (50% reduction):

- Compressed segments: 50,000 tokens
- Context retrieval: 4,000 tokens
- Agent run cost: ~$0.01
- **Savings: 50%**

**Compression Cost**:

- One-time: ~$0.05 (summarization)
- Amortized over 10 runs: $0.005/run
- **Net savings: 45%**

### 8.2 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Compression ratio | 40-60% | Token reduction |
| Processing time | <2 min/50 pages | End-to-end |
| OCR accuracy | >95% | Character-level |
| Information retention | >90% | Quality eval |
| Cost reduction | 30-50% | Per agent run |

---

## 9. Security & Privacy

### 9.1 Data Protection

**Compressed Data**:

- Same RLS policies as raw chunks
- User isolation via project ownership
- Encrypted at rest (Supabase)

**OCR Processing**:

- Local OCR: No data leaves server
- Cloud OCR: Encrypted in transit
- No persistent storage of page images (optional)

### 9.2 Access Control

**Permissions**:

- Users can only compress their own documents
- Compression jobs run as user
- Audit trail via telemetry

---

## 10. Monitoring & Observability

### 10.1 Telemetry Events

```typescript
// Compression lifecycle
- optical_compression_started
- optical_compression_completed
- optical_compression_failed

// OCR lifecycle
- ocr_started
- ocr_page_processed
- ocr_completed
- ocr_failed

// Context usage
- context_built_with_compression
- compression_segment_used
```

### 10.2 Metrics Dashboard

**Key Metrics**:

- Total documents compressed
- Average token savings
- Compression success rate
- Cost savings (USD)
- Processing time distribution
- Strategy usage breakdown

---

## 11. Future Enhancements

### 11.1 Short-term (Next 3 months)

- Multi-language OCR support
- Custom compression models
- Batch compression jobs
- Compression quality scoring

### 11.2 Long-term (6+ months)

- Real-time compression
- Adaptive compression strategies
- Cross-document compression
- Compression model fine-tuning

---

## 12. Conclusion

The Optical Compression & Long-Context Engine extends AYAZMA-ONE's capabilities to handle complex, long-form documents efficiently. By combining OCR, intelligent compression, and hybrid context strategies, we achieve:

✅ **40-60% cost reduction** for long documents
✅ **Support for scanned PDFs** and image-based content
✅ **Flexible compression strategies** for different use cases
✅ **No degradation** in agent output quality
✅ **Full observability** via telemetry

The modular architecture allows for easy experimentation with different compression models and strategies, ensuring the system can evolve with advancing AI capabilities.

---

## Appendix A: Glossary

- **OCR**: Optical Character Recognition
- **RAG**: Retrieval-Augmented Generation
- **Compression Ratio**: (Raw Tokens - Compressed Tokens) / Raw Tokens
- **Hybrid Mode**: Combining compressed and raw context
- **Context Slice**: Individual piece of context
- **Segment**: Compressed representation of multiple chunks

## Appendix B: References

- [Stage 2 Implementation](./walkthrough.md)
- [Context Engineer Service](../api/modules/context-engineer/service.ts)
- [RAG Service](../api/modules/rag/ragService.ts)
- [Supabase pgvector Documentation](https://supabase.com/docs/guides/database/extensions/pgvector)
