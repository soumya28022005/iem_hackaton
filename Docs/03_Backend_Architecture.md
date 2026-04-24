# NexusOps — Backend Architecture (Node.js + LangChain + RAG)

> **Stack:** Express.js · TypeScript · LangChain.js · PostgreSQL + pgvector · BullMQ · Redis · Prisma ORM · Anthropic Claude API · OpenAI Embeddings

---

## 1. Project Structure

```
backend/
├── src/
│   ├── index.ts                          # Express entry, all routers registered
│   ├── config.ts                         # Zod-validated env config
│   ├── prisma.ts                         # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.middleware.ts            # JWT verify + attach user
│   │   ├── workspace.middleware.ts       # Attach workspace from param
│   │   └── error.middleware.ts           # Global error handler
│   │
│   ├── routers/
│   │   ├── auth.router.ts               # Login, GitHub OAuth callback
│   │   ├── workspace.router.ts          # Workspace CRUD + members
│   │   ├── webhooks.router.ts           # Telegram, Sentry, deploy webhooks
│   │   │
│   │   ├── memory/
│   │   │   ├── ingest.router.ts         # Source ingestion endpoints
│   │   │   ├── query.router.ts          # RAG Q&A, semantic search
│   │   │   ├── tasks.router.ts          # Detected tasks + Jira
│   │   │   └── problems.router.ts       # Recurring problem detection
│   │   │
│   │   └── autofix/
│   │       ├── repos.router.ts          # GitHub repo connect/list
│   │       ├── incidents.router.ts      # Incident CRUD + pipeline trigger
│   │       ├── fixes.router.ts          # Fix review, approve, dismiss
│   │       └── revert.router.ts         # Auto-revert config + history
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── workspace.service.ts
│   │   │
│   │   ├── memory/
│   │   │   ├── ingestion.service.ts     # Orchestrates ingestion pipeline
│   │   │   ├── transcription.service.ts # Whisper STT
│   │   │   ├── chunking.service.ts      # LangChain RecursiveTextSplitter
│   │   │   ├── embedding.service.ts     # OpenAI embeddings via LangChain
│   │   │   ├── rag.service.ts           # LangChain RAG chain (core)
│   │   │   ├── taskDetection.service.ts
│   │   │   ├── problemDetection.service.ts
│   │   │   └── jira.service.ts
│   │   │
│   │   ├── autofix/
│   │   │   ├── sanitization.service.ts  # PII / secret stripping
│   │   │   ├── analysis.service.ts      # Claude root cause (LangChain chain)
│   │   │   ├── fixGeneration.service.ts # Claude fix generation chain
│   │   │   ├── safetyCheck.service.ts   # AST + pattern check
│   │   │   ├── pr.service.ts            # GitHub draft PR
│   │   │   └── revert.service.ts        # Vercel/Railway revert
│   │   │
│   │   └── nexus/
│   │       ├── memoryEnrichment.service.ts  # Integration: memory → PR
│   │       ├── notification.service.ts      # Telegram + email alerts
│   │       └── dashboard.service.ts         # Unified stats
│   │
│   ├── workers/
│   │   ├── queue.ts                     # BullMQ queue + worker setup
│   │   ├── memory.worker.ts             # Ingestion + detection jobs
│   │   └── autofix.worker.ts            # Fix pipeline job
│   │
│   ├── integrations/
│   │   ├── telegramBot.ts               # Telegraf bot setup + handlers
│   │   ├── githubClient.ts              # Octokit GitHub API wrapper
│   │   ├── anthropicClient.ts           # LangChain ChatAnthropic wrapper
│   │   ├── whisperClient.ts             # OpenAI Whisper STT client
│   │   ├── jiraClient.ts                # Jira REST API
│   │   ├── vercelClient.ts              # Vercel deploy API
│   │   └── railwayClient.ts             # Railway deploy API
│   │
│   └── utils/
│       ├── chunker.ts                   # LangChain splitter helpers
│       ├── textExtractor.ts             # PDF / DOCX / MD text extraction
│       ├── sanitizer.ts                 # PII + secret stripping
│       ├── stackTraceParser.ts          # Parse file paths from stack traces
│       ├── diffUtils.ts                 # Unified diff generation
│       ├── safetyChecker.ts             # AST + pattern safety check
│       └── promptBuilder.ts            # LangChain PromptTemplate builders
│
├── prisma/
│   ├── schema.prisma                    # All models + pgvector extension
│   └── migrations/
│       ├── 001_initial_schema/
│       └── 002_add_nexus_integration/
│
├── tests/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## 2. Dependencies (`package.json`)

```json
{
  "dependencies": {
    "@langchain/anthropic": "^0.3.0",
    "@langchain/community": "^0.3.0",
    "@langchain/core": "^0.3.0",
    "@langchain/openai": "^0.3.0",
    "@octokit/rest": "^21.0.0",
    "@prisma/client": "^5.22.0",
    "bullmq": "^5.0.0",
    "express": "^4.21.0",
    "ioredis": "^5.4.0",
    "langchain": "^0.3.0",
    "telegraf": "^4.16.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "prisma": "^5.22.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.6.0"
  }
}
```

---

## 3. Entry Point (`src/index.ts`)

```typescript
import express from "express";
import cors from "cors";
import { authRouter } from "./routers/auth.router";
import { workspaceRouter } from "./routers/workspace.router";
import { webhooksRouter } from "./routers/webhooks.router";
import { ingestRouter } from "./routers/memory/ingest.router";
import { queryRouter } from "./routers/memory/query.router";
import { tasksRouter } from "./routers/memory/tasks.router";
import { problemsRouter } from "./routers/memory/problems.router";
import { reposRouter } from "./routers/autofix/repos.router";
import { incidentsRouter } from "./routers/autofix/incidents.router";
import { fixesRouter } from "./routers/autofix/fixes.router";
import { revertRouter } from "./routers/autofix/revert.router";
import { errorMiddleware } from "./middleware/error.middleware";
import { startWorkers } from "./workers/queue";

const app = express();
app.use(express.json());
app.use(cors({ origin: "https://nexusops.dev" }));

// Core
app.use("/api/v1/auth",      authRouter);
app.use("/api/v1/workspace", workspaceRouter);
app.use("/webhook",          webhooksRouter);

// Memory Engine
app.use("/api/v1/memory/ingest",    ingestRouter);
app.use("/api/v1/memory",           queryRouter);
app.use("/api/v1/memory/tasks",     tasksRouter);
app.use("/api/v1/memory/problems",  problemsRouter);

// AutoFix Engine
app.use("/api/v1/autofix/repos",     reposRouter);
app.use("/api/v1/autofix/incidents", incidentsRouter);
app.use("/api/v1/autofix/fixes",     fixesRouter);
app.use("/api/v1/autofix/revert",    revertRouter);

app.get("/health", (_req, res) => res.json({ status: "ok", version: "1.0.0" }));
app.use(errorMiddleware);

app.listen(8000, () => console.log("NexusOps API running on :8000"));
startWorkers(); // Boot BullMQ workers
```

---

## 4. Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

model Workspace {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  members   WorkspaceMember[]
  sources   Source[]
  chunks    DocumentChunk[]
  tasks     Task[]
  problems  Problem[]
  incidents Incident[]
}

model DocumentChunk {
  id          String   @id @default(uuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  sourceId    String
  source      Source    @relation(fields: [sourceId], references: [id])
  text        String
  embedding   Unsupported("vector(1536)")
  sourceType  String
  sender      String?
  channelName String?
  timestamp   DateTime
  createdAt   DateTime @default(now())

  @@index([workspaceId])
}

model Incident {
  id           String    @id @default(uuid())
  workspaceId  String
  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  repositoryId String
  repository   Repository @relation(fields: [repositoryId], references: [id])
  errorType    String
  errorMessage String
  rawStackTrace String
  severity     String
  branch       String    @default("main")
  status       String    @default("pending")
  prUrl        String?
  createdAt    DateTime  @default(now())
  fix          Fix?
}

// ... remaining models: User, Source, Task, Problem, Repository, Fix, RevertEvent
```

---

## 5. Memory Engine: RAG Service — LangChain Core

```typescript
// src/services/memory/rag.service.ts

import { ChatAnthropic } from "@langchain/anthropic";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { prisma } from "../../prisma";
import { config } from "../../config";

const SYSTEM_PROMPT = `You are NexusOps Memory, an intelligent knowledge assistant for engineering teams.

You answer questions about team decisions, discussions, and tasks based ONLY on the provided context.

Rules:
1. Only use information from the provided context.
2. Always cite source: [Source: {{type}} | {{date}} | {{sender}}]
3. If not found: "I couldn't find this in your team's records."
4. For decisions: include the rationale if mentioned.
5. Be concise (2-4 sentences) unless the question demands detail.

Context:
{context}`;

const llm = new ChatAnthropic({
  model: "claude-sonnet-4-20250514",
  maxTokens: 1000,
  anthropicApiKey: config.ANTHROPIC_API_KEY,
});

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  openAIApiKey: config.OPENAI_API_KEY,
});

export class RAGService {
  private async getVectorStore(workspaceId: string): Promise<PGVectorStore> {
    return PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions: { connectionString: config.DATABASE_URL },
      tableName: "document_chunks",
      columns: {
        idColumnName: "id",
        vectorColumnName: "embedding",
        contentColumnName: "text",
        metadataColumnName: "metadata",
      },
      filter: { workspaceId },
    });
  }

  async query(workspaceId: string, question: string) {
    const vectorStore = await this.getVectorStore(workspaceId);

    // Retriever with similarity score threshold
    const retriever = vectorStore.asRetriever({
      k: 8,
      searchType: "similarity",
      searchKwargs: { scoreThreshold: 0.65 },
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT],
      ["human", "{input}"],
    ]);

    // LangChain LCEL chain: retriever → stuff docs → Claude
    const questionAnswerChain = await createStuffDocumentsChain({ llm, prompt });
    const ragChain = await createRetrievalChain({
      retriever,
      combineDocsChain: questionAnswerChain,
    });

    const start = Date.now();
    const result = await ragChain.invoke({ input: question });

    if (!result.context?.length) {
      return {
        answer: "I couldn't find relevant info in your team's records.",
        sources: [],
        latencyMs: Date.now() - start,
      };
    }

    return {
      answer: result.answer,
      sources: result.context.slice(0, 3).map((doc) => ({
        text: doc.pageContent.slice(0, 200),
        sourceType: doc.metadata.sourceType,
        sender: doc.metadata.sender,
        timestamp: doc.metadata.timestamp,
      })),
      latencyMs: Date.now() - start,
    };
  }
}

export const ragService = new RAGService();
```

---

## 6. Memory Engine: Ingestion + Chunking Service

```typescript
// src/services/memory/chunking.service.ts

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { config } from "../../config";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 150,
  separators: ["\n\n", "\n", ". ", "! ", "? ", " "],
});

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  openAIApiKey: config.OPENAI_API_KEY,
});

export class ChunkingService {
  async ingestText(
    text: string,
    metadata: {
      workspaceId: string;
      sourceId: string;
      sourceType: string;
      sender?: string;
      channelName?: string;
      timestamp: Date;
    }
  ): Promise<number> {
    // 1. Split into semantic chunks
    const docs = await splitter.createDocuments(
      [text],
      [metadata]
    );

    // 2. Upsert into pgvector via LangChain
    const vectorStore = await PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions: { connectionString: config.DATABASE_URL },
      tableName: "document_chunks",
      columns: {
        idColumnName: "id",
        vectorColumnName: "embedding",
        contentColumnName: "text",
        metadataColumnName: "metadata",
      },
    });

    await vectorStore.addDocuments(docs);
    return docs.length;
  }

  async ingestDocuments(docs: Document[]): Promise<void> {
    const vectorStore = await PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions: { connectionString: config.DATABASE_URL },
      tableName: "document_chunks",
    });
    await vectorStore.addDocuments(docs);
  }
}

export const chunkingService = new ChunkingService();
```

---

## 7. AutoFix Engine: Analysis + Fix Generation (LangChain Chains)

```typescript
// src/services/autofix/analysis.service.ts

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { config } from "../../config";

const llm = new ChatAnthropic({
  model: "claude-sonnet-4-20250514",
  maxTokens: 2000,
  anthropicApiKey: config.ANTHROPIC_API_KEY,
});

const analysisPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert software engineer performing root cause analysis.

Error: {errorMessage}
Stack Trace:
{stackTrace}

Relevant Code:
{codeSnippets}

Respond ONLY with a valid JSON object:
{{
  "rootCause": "concise description",
  "explanation": "detailed explanation",
  "affectedFiles": [{{ "path": "...", "lines": [n, m] }}],
  "keywords": ["keyword1", "keyword2"],
  "confidence": 0.0-1.0
}}
`);

const fixPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert software engineer generating a precise bug fix.

Root Cause: {rootCause}
Explanation: {explanation}

Code to Fix:
{codeSnippets}

Team Memory Context (if available):
{memoryContext}

Respond ONLY with a valid JSON object:
{{
  "explanation": "what and why",
  "fileChanges": [{{
    "path": "...",
    "originalCode": "...",
    "fixedCode": "...",
    "explanation": "..."
  }}],
  "confidence": 0.0-1.0
}}
`);

// LCEL chain: prompt | llm | json parser
export const analysisChain = RunnableSequence.from([
  analysisPrompt,
  llm,
  new JsonOutputParser(),
]);

export const fixGenerationChain = RunnableSequence.from([
  fixPrompt,
  llm,
  new JsonOutputParser(),
]);
```

---

## 8. NexusOps Integration: Memory Enrichment Service

```typescript
// src/services/nexus/memoryEnrichment.service.ts

import { OpenAIEmbeddings } from "@langchain/openai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { config } from "../../config";

export interface MemoryContext {
  found: boolean;
  chunks: Array<{ text: string; source: string; similarity: number }>;
  summary: string;
}

const llm = new ChatAnthropic({
  model: "claude-sonnet-4-20250514",
  maxTokens: 200,
  anthropicApiKey: config.ANTHROPIC_API_KEY,
});

const summaryChain = RunnableSequence.from([
  ChatPromptTemplate.fromTemplate(
    `Context from team discussions:\n{context}\n\nIn 1-2 sentences, what did the team previously say about: {query}?`
  ),
  llm,
  new StringOutputParser(),
]);

export class MemoryEnrichmentService {
  /**
   * Queries Memory Engine using AutoFix incident context.
   * Finds relevant past discussions about the error or affected code.
   */
  async getContext(
    workspaceId: string,
    errorKeywords: string[],
    affectedFiles: Array<{ path: string }>
  ): Promise<MemoryContext | null> {
    if (!workspaceId) return null;

    const fileNames = affectedFiles.map((f) => f.path.split("/").pop() ?? "");
    const searchQuery = [...errorKeywords.slice(0, 5), ...fileNames.slice(0, 3)].join(" ");

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      openAIApiKey: config.OPENAI_API_KEY,
    });

    const vectorStore = await PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions: { connectionString: config.DATABASE_URL },
      tableName: "document_chunks",
      columns: {
        idColumnName: "id",
        vectorColumnName: "embedding",
        contentColumnName: "text",
        metadataColumnName: "metadata",
      },
      filter: { workspaceId },
    });

    const results = await vectorStore.similaritySearchWithScore(searchQuery, 5);

    // Filter by similarity threshold (0.60)
    const filtered = results.filter(([, score]) => score >= 0.60);
    if (!filtered.length) return null;

    const chunks = filtered.slice(0, 3).map(([doc, score]) => ({
      text: doc.pageContent.slice(0, 300),
      source: `${doc.metadata.sourceType} | ${doc.metadata.timestamp} | ${doc.metadata.sender ?? "Unknown"}`,
      similarity: Math.round(score * 100) / 100,
    }));

    const contextText = filtered.map(([doc]) => doc.pageContent).join("\n\n");
    const summary = await summaryChain.invoke({ context: contextText, query: searchQuery });

    return { found: true, chunks, summary };
  }
}

export const memoryEnrichmentService = new MemoryEnrichmentService();
```

---

## 9. AutoFix Pipeline Worker (BullMQ)

```typescript
// src/workers/autofix.worker.ts

import { Worker, Queue } from "bullmq";
import { redis } from "../integrations/redis";
import { prisma } from "../prisma";
import { sanitizationService } from "../services/autofix/sanitization.service";
import { analysisChain, fixGenerationChain } from "../services/autofix/analysis.service";
import { safetyCheckService } from "../services/autofix/safetyCheck.service";
import { prService } from "../services/autofix/pr.service";
import { memoryEnrichmentService } from "../services/nexus/memoryEnrichment.service";
import { notificationService } from "../services/nexus/notification.service";
import { stackTraceParser } from "../utils/stackTraceParser";
import { githubClient } from "../integrations/githubClient";

export const autofixQueue = new Queue("autofix", { connection: redis });

const setStatus = (incidentId: string, status: string, extra?: object) =>
  prisma.incident.update({ where: { id: incidentId }, data: { status, ...extra } });

export const autofixWorker = new Worker(
  "autofix",
  async (job) => {
    const { incidentId } = job.data;
    const incident = await prisma.incident.findUniqueOrThrow({
      where: { id: incidentId },
      include: { repository: true },
    });

    try {
      // Step 1: Sanitize
      await setStatus(incidentId, "sanitizing");
      const sanitized = await sanitizationService.sanitize(
        incident.errorMessage,
        incident.rawStackTrace
      );

      // Step 2: Fetch code from GitHub
      await setStatus(incidentId, "fetching_code");
      const fileRefs = stackTraceParser.extractFiles(sanitized.stackTrace);
      const codeSnippets = await githubClient.fetchCodeContext(
        incident.repository.fullName,
        fileRefs,
        incident.branch
      );

      // Step 3: Root cause analysis (LangChain chain)
      await setStatus(incidentId, "analyzing");
      const analysis = await analysisChain.invoke({
        errorMessage: sanitized.error,
        stackTrace: sanitized.stackTrace,
        codeSnippets: JSON.stringify(codeSnippets),
      });

      // *** NEXUS INTEGRATION: Query Memory Engine ***
      await setStatus(incidentId, "querying_memory");
      const memoryContext = await memoryEnrichmentService.getContext(
        incident.workspaceId,
        analysis.keywords,
        analysis.affectedFiles
      );

      // Step 4: Fix generation (LangChain chain with memory context)
      await setStatus(incidentId, "generating_fix");
      const fix = await fixGenerationChain.invoke({
        rootCause: analysis.rootCause,
        explanation: analysis.explanation,
        codeSnippets: JSON.stringify(codeSnippets),
        memoryContext: memoryContext?.summary ?? "No relevant team history found.",
      });

      // Step 5: Safety check
      const safety = await safetyCheckService.check(fix);
      if (safety.score === "BLOCKED") {
        await setStatus(incidentId, "fix_blocked");
        await notificationService.notifyBlocked(incident, safety);
        return;
      }

      // Step 6: Create draft PR (memory context injected here)
      await setStatus(incidentId, "creating_pr");
      const prUrl = await prService.createDraftPR({
        repo: incident.repository.fullName,
        fix,
        analysis,
        memoryContext,   // ← NexusOps magic
        safety,
        incident,
      });

      // Step 7: Finalize + notify
      await setStatus(incidentId, "pr_created", { prUrl });
      await notificationService.notifyPRCreated(incident, prUrl, analysis, memoryContext);

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await setStatus(incidentId, "failed");
      await notificationService.notifyFailure(incident, message);
      throw err; // BullMQ handles retry
    }
  },
  {
    connection: redis,
    concurrency: 5,
    defaultJobOptions: { attempts: 2, backoff: { type: "exponential", delay: 5000 } },
  }
);
```

---

## 10. BullMQ Queue Setup + Memory Workers

```typescript
// src/workers/queue.ts

import { Worker, Queue, QueueScheduler } from "bullmq";
import { redis } from "../integrations/redis";
import { autofixWorker, autofixQueue } from "./autofix.worker";
import { memoryWorker } from "./memory.worker";

export const memoryQueue = new Queue("memory", { connection: redis });

// Scheduled jobs (replaces Celery beat)
export async function startWorkers() {
  console.log("🚀 BullMQ workers started");

  // Repeatable jobs — replaces celery beat
  await memoryQueue.add(
    "detect-tasks",
    {},
    { repeat: { every: 60 * 60 * 1000 } }   // every 1hr
  );

  await memoryQueue.add(
    "detect-problems",
    {},
    { repeat: { every: 6 * 60 * 60 * 1000 } } // every 6hr
  );

  return { autofixWorker, memoryWorker };
}

// Queue name → priority mapping
export const QUEUES = {
  HIGH:    "memory:transcribe",   // voice transcription
  DEFAULT: "autofix",             // incident pipeline
  LOW:     "memory",              // task/problem detection
} as const;
```

---

## 11. Webhook Security

```typescript
// src/routers/webhooks.router.ts

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../prisma";
import { autofixQueue } from "../workers/queue";
import { incidentService } from "../services/autofix/incident.service";

const router = Router();

function verifyHMAC(body: Buffer, secret: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

router.post(
  "/sentry/:projectToken",
  express.raw({ type: "application/json" }), // raw body for HMAC
  async (req: Request, res: Response) => {
    const project = await prisma.project.findUnique({
      where: { webhookToken: req.params.projectToken },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    const signature =
      req.headers["sentry-hook-signature"] as string ??
      req.headers["x-nexusops-signature"] as string ?? "";

    if (!verifyHMAC(req.body, project.sentryWebhookSecret, signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = JSON.parse(req.body.toString());
    const incident = await incidentService.createFromSentry(payload, project);

    // Enqueue AutoFix pipeline job
    await autofixQueue.add("process_incident", { incidentId: incident.id });

    return res.json({ status: "accepted", incidentId: incident.id });
  }
);

export { router as webhooksRouter };
```

---

## 12. PR Body Builder (with Memory Context)

```typescript
// src/utils/promptBuilder.ts

interface PRBodyOptions {
  fix: Fix;
  analysis: Analysis;
  memoryContext: MemoryContext | null;
  safety: SafetyReport;
  incident: Incident;
}

export function buildPRBody({
  fix,
  analysis,
  memoryContext,
  safety,
  incident,
}: PRBodyOptions): string {
  const memorySection =
    memoryContext?.found
      ? `
---

### 🧠 Team Memory Context
*NexusOps found relevant past discussions about this issue:*

> ${memoryContext.summary}

**Sources:**
${memoryContext.chunks.map((c) => `- ${c.source}: "${c.text.slice(0, 120)}..."`).join("\n")}
`
      : "";

  return `## 🤖 NexusOps AutoFix — Draft PR

> **⚠️ DRAFT — Review before merging. AI-generated fix.**

---

### 📋 Incident
- **Error:** \`${incident.errorType}: ${incident.errorMessage.slice(0, 150)}\`
- **Severity:** ${incident.severity}
- **Detected:** ${incident.createdAt.toISOString()}

---

### 🔍 Root Cause
${analysis.explanation}

**Confidence:** ${(fix.confidence * 100).toFixed(0)}%

---

### 🔧 Fix Applied
${fix.explanation}

**Files changed:** ${fix.fileChanges.map((fc) => `\`${fc.path}\``).join(", ")}

---

### 🛡️ Safety Check
**Score:** \`${safety.score}\`
${safety.summary}
${memorySection}
---

*Generated by [NexusOps](https://nexusops.dev) | Incident: \`${incident.id.slice(0, 8)}\`*`;
}
```

---

## 13. Docker Compose (Local Dev)

```yaml
version: "3.8"
services:
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: nexusops
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [postgres, redis]
    env_file: .env
    command: npx ts-node src/index.ts

  bullmq-worker:
    build: ./backend
    depends_on: [postgres, redis]
    env_file: .env
    command: npx ts-node src/workers/queue.ts

  telegram-bot:
    build: ./backend
    depends_on: [postgres, redis]
    env_file: .env
    command: npx ts-node src/integrations/telegramBot.ts

volumes:
  pgdata:
```

> **Note:** In production, use `tsx` or compile to `dist/` and run `node dist/index.js`.

---

## 14. LangChain Stack Summary

| Python (old)                      | Node.js LangChain.js (new)                       |
|-----------------------------------|--------------------------------------------------|
| `PGVector` (SQLAlchemy)           | `PGVectorStore` (`@langchain/community`)         |
| `openai` embeddings               | `OpenAIEmbeddings` (`@langchain/openai`)         |
| `anthropic` client                | `ChatAnthropic` (`@langchain/anthropic`)         |
| `create_retrieval_chain` (Python) | `createRetrievalChain` (`langchain`)             |
| `create_stuff_documents_chain`    | `createStuffDocumentsChain` (`langchain`)        |
| `RecursiveCharacterTextSplitter`  | `RecursiveCharacterTextSplitter` (`langchain`)   |
| `PromptTemplate`                  | `ChatPromptTemplate` (`@langchain/core/prompts`) |
| `JsonOutputParser`                | `JsonOutputParser` (`@langchain/core/output_parsers`) |
| Celery + Redis                    | BullMQ + Redis (`bullmq`)                        |
| SQLAlchemy ORM                    | Prisma ORM (`@prisma/client`)                    |
| FastAPI                           | Express.js + TypeScript                          |