# NexusOps — Technical Requirements Document (TRD)

## 1. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 14 (App Router), TypeScript | SSR, file-based routing, type safety |
| Styling | Tailwind CSS + shadcn/ui | Rapid consistent UI |
| State | Zustand | Lightweight global state |
| Backend | Express.js + TypeScript (Node.js 20+) | Unified JS/TS stack, LangChain.js native |
| RAG Framework | LangChain.js (`langchain`, `@langchain/core`, `@langchain/community`) | LCEL chains, retrieval, chunking, output parsers |
| Primary DB | PostgreSQL 15 + pgvector | Relational + vector search in one DB |
| ORM | Prisma ORM + Prisma Migrate | Type-safe DB access, pgvector extension support |
| Cache / Queue | Redis (Upstash) + BullMQ | Job queue, rate limiting, dedup, repeatable beat jobs |
| Object Storage | Cloudflare R2 | Voice notes, audio, uploaded docs |
| AI / LLM | Anthropic Claude claude-sonnet-4-20250514 via `@langchain/anthropic` | Q&A, task detection, fix generation, root cause |
| Embeddings | OpenAI text-embedding-3-small via `@langchain/openai` | 1536-dim vectors for semantic search |
| Vector Store | `PGVectorStore` (`@langchain/community`) | LangChain-native pgvector retriever |
| STT | OpenAI Whisper API | Voice note transcription |
| Telegram | Telegraf v4 (Node.js) | Team message + voice ingestion |
| GitHub | Octokit (`@octokit/rest`) + GitHub OAuth App | Code fetch, branch create, PR creation |
| Auth | NextAuth.js (GitHub OAuth) | Single sign-on — GitHub is required anyway |
| Diff Viewer | react-diff-viewer-continued | Code diff display in frontend |
| Notifications | Telegraf (same bot instance) | Alerts for incidents and PRs |
| Jira | Atlassian REST API v3 | Task ticket creation |
| Deployment | Vercel (frontend) + Railway (backend + workers) | Fast hackathon deploy |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            INPUT SOURCES                                     │
│                                                                              │
│  [Telegram Messages]  [Voice Notes]  [Sentry Webhook]  [GitHub Events]      │
│  [Document Uploads]   [Meetings]     [Custom Webhooks]  [Manual Input]      │
└───────────┬──────────────────┬────────────────┬──────────────────────────────┘
            │                  │                │
            ▼                  ▼                ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                   EXPRESS.JS BACKEND — TypeScript (Single Service)            │
│                                                                               │
│  /api/v1/memory/*    ←── Memory Engine routes                                │
│  /api/v1/autofix/*   ←── AutoFix Engine routes                               │
│  /api/v1/nexus/*     ←── Integration Layer routes                            │
│  /webhook/*          ←── Telegram + Sentry + Deploy webhooks                 │
└───────────┬────────────────────┬──────────────────────────────────────────────┘
            │                    │
            ▼                    ▼
┌────────────────────┐   ┌───────────────────────────────────────────────────┐
│   SYNC HANDLERS    │   │           BULLMQ ASYNC WORKERS                    │
│                    │   │                                                   │
│ • JWT auth         │   │  Queue: memory:transcribe → voice (HIGH)          │
│ • RAG Q&A          │   │  Queue: autofix           → fix pipeline (DEFAULT)│
│ • Task CRUD        │   │  Queue: memory            → detection scans (LOW) │
│ • Fix review       │   │                                                   │
│ • Dashboard stats  │   │  Repeatable: detect-tasks (1hr), problems (6hr)  │
└────────────────────┘   └───────────────────────────────────────────────────┘
            │                    │
            └─────────┬──────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
│                                                                              │
│   PostgreSQL 15 + pgvector          Redis (Upstash)     Cloudflare R2       │
│   ├── users, workspaces             ├── BullMQ queue    ├── voice notes      │
│   ├── sources (Memory)              ├── rate limits     ├── meeting audio    │
│   ├── document_chunks + vectors     ├── session cache   └── uploaded docs    │
│   ├── query_history                 └── dedup keys                          │
│   ├── tasks, decisions                                                       │
│   ├── incidents (AutoFix)                                                   │
│   ├── fixes, revert_events                                                  │
│   └── repositories                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LANGCHAIN.JS + EXTERNAL AI SERVICES                       │
│                                                                              │
│  ChatAnthropic (LangChain)       OpenAIEmbeddings (LangChain)               │
│  ├── createRetrievalChain (RAG)  ├── text-embedding-3-small                 │
│  ├── RunnableSequence (AutoFix)  ├── 1536-dim vectors                       │
│  ├── JsonOutputParser (fix JSON) └── PGVectorStore (pgvector retriever)     │
│  └── StringOutputParser                                                     │
│                                                                             │
│  OpenAI Whisper                                                             │
│  └── voice transcription + language detection                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Module API Design

### Base URL: `/api/v1`

#### Auth
```
POST   /auth/login
POST   /auth/refresh
DELETE /auth/logout
GET    /auth/github/callback
```

#### Memory Engine Routes
```
POST   /memory/ingest/telegram/connect    → link Telegram group
POST   /memory/ingest/telegram/history    → bulk import history
POST   /memory/ingest/audio               → upload voice note / meeting
POST   /memory/ingest/document            → upload PDF/DOCX/MD
GET    /memory/ingest/jobs/:job_id        → poll BullMQ job status
POST   /memory/query                      → LangChain RAG Q&A
GET    /memory/search?q=...               → semantic search (raw chunks)
GET    /memory/sources                    → list all sources
GET    /memory/tasks                      → detected tasks
PATCH  /memory/tasks/:id                  → update task status
POST   /memory/tasks/:id/jira             → push to Jira
GET    /memory/problems                   → recurring issues
```

#### AutoFix Engine Routes
```
POST   /autofix/repos/connect             → connect GitHub repo (Octokit)
GET    /autofix/repos                     → list repos
DELETE /autofix/repos/:id
POST   /autofix/incidents/manual          → manually submit error
GET    /autofix/incidents                 → incident list
GET    /autofix/incidents/:id             → incident + fix detail
PATCH  /autofix/incidents/:id/status      → dismiss / resolve
POST   /autofix/incidents/:id/retry       → re-enqueue BullMQ job
POST   /autofix/fixes/:id/approve         → create real PR from draft
POST   /autofix/revert/trigger            → manual revert
```

#### Integration Layer Routes
```
GET    /nexus/memory-context/:incident_id → PGVectorStore search for incident
GET    /nexus/dashboard                   → unified stats for both modules
GET    /nexus/timeline                    → combined activity feed
```

#### Webhooks
```
POST   /webhook/telegram/:workspace_token
POST   /webhook/sentry/:project_token
POST   /webhook/error/:project_token
POST   /webhook/deploy/:project_token
```

---

## 4. Key Pipeline Designs

### Memory Ingestion Pipeline
```
Source received (Telegram / audio / doc)
→ Store raw source + metadata in DB (Prisma)
→ Enqueue BullMQ job (memory:transcribe if audio, memory if text/doc)
→ Worker: transcribe (Whisper) if audio
→ Worker: extract text (pdf-parse / mammoth) if doc
→ LangChain RecursiveCharacterTextSplitter (chunkSize: 1000, overlap: 150)
→ Batch embed via OpenAIEmbeddings (LangChain) — text-embedding-3-small
→ PGVectorStore.addDocuments() → stores chunks + embeddings in pgvector
→ Update source status → 'processed' (Prisma)
```

### AutoFix Pipeline
```
Error webhook received
→ Validate HMAC (crypto.timingSafeEqual)
→ Create incident record (Prisma)
→ Enqueue BullMQ job: autofix queue

BullMQ Worker:
1. Sanitize: strip secrets/PII from error + stack trace
2. Parse stack trace → file paths + line numbers
3. Octokit: fetch file content + 60-line context per file
4. LangChain analysisChain (RunnableSequence):
   analysisPrompt | ChatAnthropic | JsonOutputParser
   → { rootCause, affectedFiles, keywords, confidence }
5. LangChain fixGenerationChain (RunnableSequence):
   fixPrompt | ChatAnthropic | JsonOutputParser
   → { fileChanges: [{ path, originalCode, fixedCode }] }
6. Safety check: AST parse + dangerous pattern scan
7. If BLOCKED → notify team via Telegraf, stop
8. Octokit: create branch → commit changes → open draft PR
9. Telegraf notify: PR link + incident summary
```

### Integration: Memory-Enriched PR
```
After analysisChain completes (root cause done):
→ Extract error keywords + file names from analysis output
→ memoryEnrichmentService.getContext(workspaceId, keywords, files)
→ PGVectorStore.similaritySearchWithScore(query, 5) — threshold: 0.60
→ Fetch top 3 relevant memory chunks
→ summaryChain (ChatAnthropic | StringOutputParser) summarizes in 1-2 sentences
→ Include in PR body as "🧠 Team Memory Context" section
→ Final PR: Code Fix + Root Cause + Memory Context (NexusOps differentiator)
```

---

## 5. Performance Requirements

| Operation | Target P95 |
|-----------|-----------|
| Memory Q&A (LangChain RAG) | < 4s |
| PGVectorStore semantic search | < 600ms |
| Voice transcription (5 min) | < 30s |
| Error → Draft PR (full pipeline) | < 30s |
| Auto-revert trigger | < 30s from threshold breach |
| pgvector similarity search | < 400ms |

---

## 6. Security Requirements

- All API routes: JWT Bearer token auth (Express middleware)
- Every Prisma query scoped to `workspaceId` (workspace isolation)
- Webhook validation: `crypto.timingSafeEqual` HMAC-SHA256 on every inbound webhook
- Sanitization: runs BEFORE any data touches LangChain / Claude API
- GitHub + Jira tokens: AES-256 encrypted in DB
- Telegram bot token: env secret, never exposed to frontend
- Rate limits: 100 req/min per workspace on AI endpoints (Redis-backed)

---

## 7. Environment Variables

```env
# Core
DATABASE_URL=postgresql://user:pass@host/nexusops
REDIS_URL=redis://...
SECRET_KEY=...
NODE_ENV=production

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Integrations
TELEGRAM_BOT_TOKEN=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_WEBHOOK_SECRET=...
SENTRY_WEBHOOK_SECRET=...
JIRA_BASE_URL=https://team.atlassian.net
JIRA_API_TOKEN=...
JIRA_USER_EMAIL=...

# Deploy platforms (for auto-revert)
VERCEL_TOKEN=...
RAILWAY_TOKEN=...

# Storage
CLOUDFLARE_R2_ACCESS_KEY=...
CLOUDFLARE_R2_SECRET_KEY=...
CLOUDFLARE_R2_BUCKET=nexusops

# Frontend
NEXT_PUBLIC_API_URL=https://api.nexusops.dev
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://nexusops.dev
NEXT_PUBLIC_GITHUB_CLIENT_ID=...
```

---

## 8. Third-Party Cost Estimate (Hackathon)

| Service | Usage | Estimated Cost |
|---------|-------|---------------|
| Anthropic Claude | ~500 queries × $0.003 | ~$1.50 |
| OpenAI Embeddings | ~100k chunks × $0.0001/1k | ~$0.01 |
| OpenAI Whisper | ~60 min audio × $0.006/min | ~$0.36 |
| Telegram Bot API | Unlimited | $0 |
| GitHub API (Octokit) | OAuth free tier | $0 |
| Railway (backend) | Free tier | $0 |
| Vercel (frontend) | Hobby free | $0 |
| Cloudflare R2 | 10GB free | $0 |
| Upstash Redis + BullMQ | 10k cmds/day free | $0 |
| **Total** | | **< $3** |

---

## 9. Stack Migration Summary

| Old (Python) | New (Node.js + LangChain) |
|---|---|
| FastAPI | Express.js + TypeScript |
| SQLAlchemy 2.0 async + Alembic | Prisma ORM + Prisma Migrate |
| Celery + Redis beat | BullMQ + repeatable jobs |
| `anthropic` Python SDK | `ChatAnthropic` (`@langchain/anthropic`) |
| `openai` Python SDK | `OpenAIEmbeddings` (`@langchain/openai`) |
| `PGVector` (Python) | `PGVectorStore` (`@langchain/community`) |
| `create_retrieval_chain` (Python) | `createRetrievalChain` (LangChain.js) |
| `RecursiveCharacterTextSplitter` | Same — LangChain.js |
| `python-telegram-bot` v20 | Telegraf v4 |
| `PyGithub` | `@octokit/rest` |
| `pdfplumber` + `python-docx` | `pdf-parse` + `mammoth` |