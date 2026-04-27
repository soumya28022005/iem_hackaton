<div align="center">

<br />

```
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗ ██████╗ ██████╗ ███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝██╔═══██╗██╔══██╗██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗██║   ██║██████╔╝███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║██║   ██║██╔═══╝ ╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║╚██████╔╝██║     ███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝     ╚══════╝
```

### The Intelligent Command Center for Modern AIOps

<br />

[![Version](https://img.shields.io/badge/version-2.0.4-6D28D9?style=flat-square)](https://github.com/soumyachk101/NexusOps-2.0/releases)
[![License](https://img.shields.io/badge/license-MIT-0F6E56?style=flat-square)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![LangChain](https://img.shields.io/badge/LangChain.js-0.3-1C3C3C?style=flat-square)](https://js.langchain.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/docker-compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)

<br />

> *Most AI observability tools only see the current stack trace.*  
> *NexusOps sees the last 6 months of your team's institutional memory.*

<br />

[Getting Started](#-getting-started) · [Architecture](#-architecture) · [Features](#-core-features) · [Configuration](#-configuration) · [Contributing](#-contributing)

<br />

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start with Docker](#quick-start-with-docker)
  - [Manual Installation](#manual-installation)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Security Model](#-security-model)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📌 Overview

**NexusOps 2.0** is a production-grade operational intelligence platform engineered for Site Reliability Engineers who need more than alerts — they need *context*. It is built on the principle that the most critical information during an incident is not what broke, but **what broke before and how the team fixed it**.

NexusOps unifies three pillars into a single cohesive workflow:

| Pillar | What it does |
|---|---|
| **Event Ingestion** | Consumes webhooks from Sentry, custom telemetry pipelines, and Telegram |
| **Memory Enrichment** | Augments each incident with semantically similar past events and runbooks via LangChain.js + pgvector |
| **AI Remediation** | Generates root cause analysis and a draft code fix via Claude Sonnet 4 through LangChain LCEL chains |

No auto-merges. No silent deployments. Every fix is a Draft Pull Request reviewed by a human engineer.

---

## 🏗️ Architecture

NexusOps is designed as a distributed, event-driven system with strict separation between the ingestion layer, the intelligence layer, and the resolution layer.

```mermaid
graph TD
    subgraph INGESTION ["⬛ Ingestion Mesh"]
        A1[🔴 Sentry Webhooks]
        A2[✈️ Telegram Bot — Telegraf]
        A3[📡 Custom Telemetry]
    end

    subgraph INTELLIGENCE ["🟣 Intelligence Layer"]
        B1[⚡ Express.js + TypeScript Gateway]
        B2[🛡️ PII & Secret Sanitizer]
        B3[🧠 LangChain Memory Enrichment]
        B4[🗄️ PostgreSQL + pgvector\nPGVectorStore]
        B5[⚙️ BullMQ Pipeline Controller]
        B6[(🔴 Redis Cache & Queue)]
    end

    subgraph RESOLUTION ["🟢 Resolution Layer"]
        C1[🤖 Claude Sonnet 4\nvia ChatAnthropic LangChain]
        C2[🔧 LCEL AutoFix Chain\nRunnableSequence + JsonOutputParser]
        C3[📬 GitHub Draft PR — Octokit]
        C4[🖥️ Cinematic Dashboard]
        C5[📩 Telegram Notification]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B1

    B1 --> B2
    B2 --> B3
    B3 <--> B4
    B3 --> B5
    B5 <--> B6
    B5 --> C1

    C1 --> C2
    C2 --> C3
    C2 --> C4
    C2 --> C5

    style INGESTION fill:#1e1e2e,stroke:#6D28D9,color:#fff
    style INTELLIGENCE fill:#1e1e2e,stroke:#7C3AED,color:#fff
    style RESOLUTION fill:#1e1e2e,stroke:#059669,color:#fff
```

### Data Flow

```mermaid
sequenceDiagram
    autonumber
    participant SW as Sentry Webhook
    participant GW as Express.js Gateway
    participant SN as PII Sanitizer
    participant ME as LangChain Memory Engine
    participant DB as PostgreSQL + pgvector
    participant BQ as BullMQ + Redis
    participant AI as Claude Sonnet 4 (LangChain)
    participant GH as GitHub (Octokit)
    participant TG as Telegram (Telegraf)

    SW->>GW: POST /webhook/sentry (HMAC verified)
    GW->>SN: Raw incident payload
    SN->>SN: Strip API keys, IPs, emails (local)
    SN->>ME: Sanitized payload
    ME->>DB: PGVectorStore.similaritySearchWithScore (top-k, threshold 0.60)
    DB-->>ME: Relevant past incidents + runbooks
    ME->>BQ: Enqueue enriched incident job
    BQ->>AI: analysisChain.invoke() — sanitized trace + memory context
    AI-->>BQ: JsonOutputParser → { rootCause, affectedFiles, confidence }
    BQ->>AI: fixGenerationChain.invoke() — code + memory summary
    AI-->>BQ: JsonOutputParser → { fileChanges, explanation }
    BQ->>GH: Octokit — create branch + commit + Draft PR
    BQ->>TG: Telegraf notify — PR link + confidence badge
    BQ->>GW: Update incident status → RESOLVED (Prisma)
```

---

## ⚡ Core Features

### Memory Engine

The Memory Engine is the primary differentiator of NexusOps. Built on `PGVectorStore` from `@langchain/community` with cosine similarity search, it maintains a continuously updated knowledge base drawn from:

- **Incident History** — Every resolved incident is vectorized via `OpenAIEmbeddings` and stored. When a new incident arrives, the top-k most semantically similar past events are surfaced.
- **Team Discussions** — Telegram threads ingested via Telegraf are chunked with LangChain's `RecursiveCharacterTextSplitter` and indexed automatically, capturing informal tribal knowledge that never makes it into runbooks.
- **Runbooks & Internal Documentation** — Structured documentation ingested, chunked, and stored via `PGVectorStore.addDocuments()`.

> **Why this matters:** An SRE triaging a `NullPointerException` in a payment service at 2 AM needs to know that the same error surfaced 3 months ago because of a race condition in the order fulfillment pipeline — and that the fix was a 2-line database transaction scope change. NexusOps surfaces this in the incident brief automatically.

### AutoFix Engine

Powered by **Claude Sonnet 4** via LangChain's `ChatAnthropic`, the AutoFix Engine uses LCEL `RunnableSequence` chains with `JsonOutputParser` for structured, type-safe output:

| Property | Detail |
|---|---|
| **Chain Pattern** | `analysisPrompt \| ChatAnthropic \| JsonOutputParser` |
| **Input** | Sanitized stack trace + enriched memory context |
| **Output** | Root cause analysis + line-level code fix + confidence score |
| **Confidence Tiers** | `SAFE` · `REVIEW` · `BLOCKED` |
| **Output Artifact** | GitHub Draft PR (via Octokit) with cited memory context |

### Cinematic Dashboard

A real-time incident command interface built with Next.js 14 App Router, Framer Motion, and Shadcn/UI. Designed for high-stress, low-latency decision making — not for demo slides.

### Security-First by Design

NexusOps treats data privacy as a first-class architectural constraint, not an afterthought:

- **Local PII Sanitization** — All secrets, API keys, email addresses, and IP addresses are stripped at the ingestion gateway using a deterministic regex engine before any data leaves the system boundary.
- **Cryptographic Audit Logs** — Every AI inference action is hashed and logged with full attribution to a specific incident ID and user.
- **Draft-Only PRs** — NexusOps is architecturally incapable of merging code. It creates Draft Pull Requests only via Octokit. Merge authority belongs exclusively to the human engineer.

---

## 🛠️ Tech Stack

### Backend

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 20.x + TypeScript 5.6 | Core application runtime, unified JS/TS stack |
| Framework | Express.js 4.x | Async HTTP gateway, middleware pipeline |
| ORM | Prisma ORM + Prisma Migrate | Type-safe DB access, pgvector extension, migrations |
| Task Queue | BullMQ + Redis | Async incident processing, repeatable scheduled jobs |
| RAG Framework | LangChain.js (`langchain`, `@langchain/core`) | LCEL chains, retrieval, chunking, output parsers |
| Vector Store | `PGVectorStore` (`@langchain/community`) | LangChain-native pgvector retriever |
| LLM | `ChatAnthropic` (`@langchain/anthropic`) — Claude Sonnet 4 | Root cause analysis + fix generation |
| Embeddings | `OpenAIEmbeddings` (`@langchain/openai`) — text-embedding-3-small | 1536-dim semantic vectors |
| Text Splitting | `RecursiveCharacterTextSplitter` (LangChain.js) | Semantic chunking for ingestion pipeline |
| Telegram | Telegraf v4 | Team message + voice ingestion + notifications |
| GitHub | `@octokit/rest` | Code fetch, branch create, Draft PR creation |

### Frontend

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR/RSC, routing, API layer |
| Styling | Tailwind CSS + Shadcn/UI | Design system, accessible components |
| Animation | Framer Motion | Incident timeline, dashboard transitions |
| State | Zustand | Global incident state management |
| Data Fetching | TanStack Query | Server state, real-time polling |

### Infrastructure

| Component | Technology |
|---|---|
| Container Orchestration | Docker Compose |
| Primary Database | PostgreSQL 15 + pgvector extension |
| Cache & Broker | Redis 7 (Upstash-compatible) + BullMQ |
| Version Control Integration | GitHub REST API v3 (Octokit) |
| Monitoring Ingestion | Sentry Webhook API |

---

## 🚀 Getting Started

### Prerequisites

Ensure the following are installed and configured on your development machine:

- **Node.js** `>= 20.x` — [Download](https://nodejs.org)
- **Docker** `>= 24.x` and **Docker Compose** `>= 2.x` — [Download](https://docker.com)
- **Git** — [Download](https://git-scm.com)

You will also need the following API credentials:

- `ANTHROPIC_API_KEY` — [Obtain from Anthropic Console](https://console.anthropic.com)
- `OPENAI_API_KEY` — For `text-embedding-3-small` embeddings
- `GITHUB_TOKEN` — Personal Access Token with `repo` scope
- `SENTRY_WEBHOOK_SECRET` — From your Sentry project's webhook settings

---

### Quick Start with Docker

The fastest path to a running instance. Spins up the full stack — PostgreSQL, Redis, backend, BullMQ worker, and frontend — with a single command.

```bash
# 1. Clone the repository
git clone https://github.com/soumyachk101/NexusOps-2.0.git
cd NexusOps-2.0

# 2. Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 3. Populate your credentials in backend/.env
#    (ANTHROPIC_API_KEY, OPENAI_API_KEY, DATABASE_URL, GITHUB_TOKEN, SENTRY_WEBHOOK_SECRET)

# 4. Build and start all services
docker-compose up --build

# 5. Run Prisma migrations (first-time setup)
docker-compose exec backend npx prisma migrate deploy

# 6. Seed pgvector extension
docker-compose exec backend npx ts-node scripts/seedPgvector.ts
```

The application will be available at:

| Service | URL |
|---|---|
| Frontend Dashboard | `http://localhost:3000` |
| Backend API | `http://localhost:8000` |
| API Documentation | `http://localhost:8000/api-docs` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

---

### Manual Installation

Use this path for development or if you prefer managing processes individually.

**1. Clone and configure**

```bash
git clone https://github.com/soumyachk101/NexusOps-2.0.git
cd NexusOps-2.0
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

**2. Start infrastructure services**

```bash
# Start PostgreSQL and Redis via Docker (or use local installations)
docker-compose up postgres redis -d
```

**3. Backend setup**

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Apply database migrations
npx prisma migrate dev

# Start the development server
npx ts-node src/index.ts
# or with hot reload:
npx tsx watch src/index.ts
```

**4. Frontend setup**

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

**5. Start the BullMQ worker** (separate terminal)

```bash
cd backend
npx ts-node src/workers/queue.ts
```

---

## ⚙️ Configuration

All configuration is managed via environment variables. Never commit `.env` files to version control.

### `backend/.env`

```env
# ── Application ─────────────────────────────────────────────────────
NODE_ENV=development
SECRET_KEY=your-secret-key-minimum-32-characters
PORT=8000

# ── Database ─────────────────────────────────────────────────────────
DATABASE_URL=postgresql://nexusops:password@localhost:5432/nexusops
PGVECTOR_DIMENSIONS=1536

# ── Redis / BullMQ ────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── AI Inference (LangChain) ─────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
MEMORY_TOP_K=5                     # Number of similar incidents to retrieve
SIMILARITY_THRESHOLD=0.60          # Minimum cosine similarity score

# ── Integrations ─────────────────────────────────────────────────────
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret

SENTRY_WEBHOOK_SECRET=your-sentry-webhook-secret
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# ── Jira ─────────────────────────────────────────────────────────────
JIRA_BASE_URL=https://team.atlassian.net
JIRA_API_TOKEN=your-jira-api-token
JIRA_USER_EMAIL=your-jira-email

# ── Storage ──────────────────────────────────────────────────────────
CLOUDFLARE_R2_ACCESS_KEY=your-r2-access-key
CLOUDFLARE_R2_SECRET_KEY=your-r2-secret-key
CLOUDFLARE_R2_BUCKET=nexusops

# ── Sanitizer ────────────────────────────────────────────────────────
SANITIZER_ENABLED=true
SANITIZER_LOG_REDACTIONS=true
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
```

---

## 📡 API Reference

Full interactive documentation is available at `/api-docs` (Swagger via `swagger-ui-express`) when the backend is running.

### Key Endpoints

```
POST   /webhook/sentry/:projectToken    Receive Sentry error events (HMAC verified)
POST   /webhook/error/:projectToken     Receive custom telemetry payloads

GET    /api/v1/autofix/incidents        List all incidents (paginated)
GET    /api/v1/autofix/incidents/:id    Get incident detail with memory context
PATCH  /api/v1/autofix/incidents/:id/status   Dismiss or resolve incident
POST   /api/v1/autofix/incidents/:id/retry    Re-enqueue BullMQ fix job

POST   /api/v1/memory/ingest/document   Ingest a document into PGVectorStore
POST   /api/v1/memory/query             LangChain RAG Q&A (createRetrievalChain)
GET    /api/v1/memory/search            Semantic search — PGVectorStore.similaritySearch

GET    /api/v1/nexus/dashboard          Unified stats for both modules
GET    /health                          Health check (liveness + readiness)
```

---

## 🔒 Security Model

```mermaid
flowchart TD
    EXT([🌐 External Input\nSentry · Telegram · Telemetry])

    subgraph BOUNDARY ["🔒 Trust Boundary — NexusOps System"]
        HMAC[✅ HMAC — crypto.timingSafeEqual]
        RATE[🚦 Rate Limiter — Redis backed]

        subgraph LOCAL ["Runs Locally — Never Leaves System"]
            SAN["🛡️ PII Sanitizer\n──────────────────\nAPI keys · JWT tokens\nEmails · IP addresses\nAWS/GCP secrets · Private keys"]
        end

        LOG[📋 Cryptographic Audit Logger\nAction hash · Actor · Incident ID]
    end

    CLAUDE([🤖 Claude Sonnet 4 via LangChain\nSanitized payload only])
    GH([📬 GitHub via Octokit\nDraft PR — no merge scope])

    EXT --> HMAC --> RATE --> SAN
    SAN -- "Sanitized payload only" --> CLAUDE
    CLAUDE --> LOG
    LOG --> GH

    style BOUNDARY fill:#0f172a,stroke:#6D28D9,color:#e2e8f0
    style LOCAL fill:#1e293b,stroke:#059669,color:#e2e8f0
```

- **HMAC Verification** — All incoming webhooks verified via `crypto.timingSafeEqual` against a shared secret before processing.
- **JWT Authentication** — Dashboard access requires a signed JWT with configurable expiry (Express middleware).
- **Rate Limiting** — Express middleware enforces per-IP and per-workspace rate limits via Redis.
- **Draft PRs Only** — The Octokit integration is scoped to `pull_request:write`. It cannot push directly to any branch.

---

## 📁 Project Structure

```
nexusops-2.0/
├── backend/
│   ├── src/
│   │   ├── routers/
│   │   │   ├── auth.router.ts
│   │   │   ├── webhooks.router.ts
│   │   │   ├── memory/
│   │   │   │   ├── ingest.router.ts
│   │   │   │   └── query.router.ts
│   │   │   └── autofix/
│   │   │       ├── incidents.router.ts
│   │   │       └── fixes.router.ts
│   │   ├── services/
│   │   │   ├── memory/
│   │   │   │   ├── rag.service.ts          # createRetrievalChain (LangChain)
│   │   │   │   ├── chunking.service.ts     # RecursiveCharacterTextSplitter
│   │   │   │   └── embedding.service.ts    # OpenAIEmbeddings + PGVectorStore
│   │   │   ├── autofix/
│   │   │   │   ├── analysis.service.ts     # analysisChain (LCEL)
│   │   │   │   ├── fixGeneration.service.ts # fixGenerationChain (LCEL)
│   │   │   │   ├── sanitization.service.ts
│   │   │   │   └── pr.service.ts           # Octokit Draft PR
│   │   │   └── nexus/
│   │   │       ├── memoryEnrichment.service.ts  # PGVectorStore similarity
│   │   │       └── notification.service.ts      # Telegraf alerts
│   │   ├── workers/
│   │   │   ├── queue.ts                    # BullMQ setup + repeatable jobs
│   │   │   ├── autofix.worker.ts           # Fix pipeline BullMQ worker
│   │   │   └── memory.worker.ts            # Ingestion BullMQ worker
│   │   ├── integrations/
│   │   │   ├── telegramBot.ts              # Telegraf v4 bot
│   │   │   ├── githubClient.ts             # @octokit/rest wrapper
│   │   │   └── anthropicClient.ts          # ChatAnthropic LangChain wrapper
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   └── index.ts                        # Express app entry
│   ├── prisma/
│   │   ├── schema.prisma                   # Prisma schema + pgvector
│   │   └── migrations/
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── incidents/
│   │   │   │   └── memory/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                         # Shadcn base components
│   │   │   ├── incident-card.tsx
│   │   │   ├── memory-panel.tsx
│   │   │   └── confidence-badge.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   └── store/
│   │       └── incidents.ts                # Zustand store
│   ├── .env.local.example
│   └── package.json
│
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
└── README.md
```

---

## 🗺️ Roadmap

- [x] Sentry webhook ingestion
- [x] LangChain.js RAG memory enrichment (PGVectorStore + pgvector)
- [x] Claude Sonnet 4 inference via LangChain LCEL chains
- [x] GitHub Draft PR generation (Octokit)
- [x] Telegram notifications (Telegraf)
- [x] Confidence scoring (SAFE / REVIEW / BLOCKED)
- [x] BullMQ async pipeline with repeatable scheduled jobs
- [ ] Slack ingestion adapter
- [ ] OpenTelemetry trace integration
- [ ] Multi-repository support
- [ ] RBAC for team-level access control
- [ ] Memory decay and re-ranking policies
- [ ] Exportable incident post-mortems (PDF)
- [ ] Self-hosted LLM option via Ollama + LangChain

---

## 🤝 Contributing

Contributions are welcome. Please follow the process below to keep the codebase clean and the review cycle fast.

**1. Fork and branch**

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-description
```

**2. Commit convention**

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

```
feat: add slack ingestion adapter
fix: resolve race condition in memory engine query
docs: update API reference for /incidents endpoint
chore: bump @langchain/anthropic to 0.4.0
```

**3. Before opening a PR**

```bash
# Backend
cd backend && npm run test && npm run type-check

# Frontend
cd frontend && npm run lint && npm run type-check
```

**4. Open a Pull Request** against `main` with a clear description of what changed and why.

---

## 📄 License

Distributed under the [MIT License](./LICENSE).

---

<div align="center">

Built by **[Soumya Chakraborty](https://chksoumya.in)** · [@soumyachk101](https://github.com/soumyachk101)

*If this project was useful to you, consider leaving a ⭐*

</div>
