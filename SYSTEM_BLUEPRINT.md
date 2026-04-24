# 🌌 NexusOps 2.0: Technical Dossier

![System Architecture](file:///Users/soumyachakraborty/.gemini/antigravity/brain/2a20121b-f9cd-43aa-866c-09e49b1d98db/nexusops_isometric_architecture_1776954539175.png)

## 🏛️ Executive Summary

NexusOps 2.0 is an **AI-Native Operational Intelligence Platform** engineered to close the "Context Gap" in modern Site Reliability Engineering (SRE). By synthesizing real-time infrastructure telemetry with organizational tribal knowledge, NexusOps provides deterministic, memory-augmented remediation for production incidents.

---

## 🏗️ Operational Architecture & Workflow

The system operates as a distributed event-driven engine. Below is the high-level operational flow from incident detection to resolution.

### 🔄 The End-to-End Workflow
```mermaid
graph LR
    subgraph "Ingestion"
        A[Sentry Error] --> B{Nexus API}
        C[Telegram Chat] --> B
        D[Voice/Docs] --> B
    end

    subgraph "Processing (BullMQ Workers)"
        B --> E[Sanitization]
        E --> F[Analysis Engine]
        F --> G[Nexus Link: Memory Search]
    end

    subgraph "Resolution"
        G --> H[Fix Generation]
        H --> I[Safety AST Check]
        I --> J[GitHub Draft PR]
    end

    style G fill:#f9f,stroke:#333,stroke-width:4px
    style J fill:#00ff00,stroke:#333,stroke-width:2px
```

### ⚡ Technical Sequence Diagram
This diagram illustrates the millisecond-precision coordination between internal services.

```mermaid
sequenceDiagram
    autonumber
    participant W as Webhook (Sentry)
    participant B as Backend (Express)
    participant BW as BullMQ Worker
    participant AI as LLM (Groq/Claude)
    participant V as Vector DB (pgvector)
    participant G as GitHub API

    W->>B: POST /webhook/sentry
    B->>BW: Enqueue process_incident
    BW->>BW: Sanitize (Strip PII)
    BW->>AI: Analyze Root Cause
    AI-->>BW: Analysis Keywords
    BW->>V: Query Memory (Similarity Search)
    V-->>BW: Relevant Team Context
    BW->>AI: Generate Fix (Context + Code)
    AI-->>BW: Unified Diff
    BW->>G: Create Draft Pull Request
    G-->>BW: PR URL
    BW->>B: Notify Team (Telegram)
```

---

## 🧠 Intelligence & Data Relationship

The **Nexus Link** relies on a sophisticated graph of relationships between users, workspaces, and operational data.

### 📊 Database Entity-Relationship (ER)
```mermaid
erDiagram
    WORKSPACE ||--o{ REPOSITORY : manages
    WORKSPACE ||--o{ SOURCE : ingests
    WORKSPACE ||--o{ INCIDENT : detects
    SOURCE ||--o{ DOCUMENT_CHUNK : contains
    INCIDENT ||--o{ FIX : generates
    REPOSITORY ||--o{ INCIDENT : triggers

    WORKSPACE {
        uuid id
        string name
        string slug
    }
    DOCUMENT_CHUNK {
        uuid id
        string text
        vector embedding
        float similarity_score
    }
    INCIDENT {
        uuid id
        string status
        string severity
        json metadata
    }
```

---

## 📈 Operational Performance Graph

The impact of NexusOps 2.0 on **Mean Time to Recovery (MTTR)** is visualised below. The "Nexus Link" integration significantly reduces the "Analysis & Context" phase.

![MTTR Improvement Graph](file:///Users/soumyachakraborty/Documents/D/NexusOp 2.0/Docs/assets/isometric_workflow.svg)

> [!TIP]
> **View High-Res Workflow**: For a detailed 3D isometric view of the remediation pipeline, see the [Isometric Workflow](file:///Users/soumyachakraborty/Documents/D/NexusOp 2.0/Docs/assets/isometric_workflow.svg).

---

## 🛡️ Governance & Resiliency Matrix

| Category | Security Control | Engineering Benefit |
| :--- | :--- | :--- |
| **Integrity** | AST Code Validation | Prevents AI-generated "hallucination" vulnerabilities. |
| **Confidentiality**| AES-256 Secret Storage | External API keys are never exposed in transit or rest. |
| **Availability** | Multi-Queue Priority | Voice ingestion (High) won't block Fix Generation (Default). |
| **Auditability** | Activity Stream | Every state change is logged with a human-readable audit trail. |

---

## 🛠️ Infrastructure Stack
- **Engine**: Express.js + TypeScript
- **Real-time**: Redis + BullMQ
- **Storage**: PostgreSQL 15 + pgvector (Prisma ORM)
- **AI Hardware**: Groq LPU™ (Inference) + Anthropic Claude 3.5 (Reasoning)

---

> [!IMPORTANT]
> This dossier is a living technical document. For architectural changes, please update the corresponding `SYSTEM_BLUEPRINT.md` and related Mermaid graphs.
