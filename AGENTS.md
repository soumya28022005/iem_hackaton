---
description: Instructions building apps with MCP
globs: *
alwaysApply: true
---

# InsForge SDK Documentation - Overview

## What is InsForge?

Backend-as-a-service (BaaS) platform providing:

- **Database**: PostgreSQL with PostgREST API
- **Authentication**: Email/password + OAuth (Google, GitHub)
- **Storage**: File upload/download
- **AI**: Chat completions and image generation (OpenAI-compatible)
- **Functions**: Serverless function deployment
- **Realtime**: WebSocket pub/sub (database + client events)

## Installation

The following is a step-by-step guide to installing and using the InsForge TypeScript SDK for Web applications. If you are building other types of applications, please refer to:
- [Swift SDK documentation](/sdks/swift/overview) for iOS, macOS, tvOS, and watchOS applications.
- [Kotlin SDK documentation](/sdks/kotlin/overview) for Android applications.
- [REST API documentation](/sdks/rest/overview) for direct HTTP API access.

### 🚨 CRITICAL: Follow these steps in order

### Step 1: Download Template

Use the `download-template` MCP tool to create a new project with your backend URL and anon key pre-configured.

### Step 2: Install SDK

```bash
npm install @insforge/sdk@latest
```

### Step 3: Create SDK Client

You must create a client instance using `createClient()` with your base URL and anon key:

```javascript
import { createClient } from '@insforge/sdk';

const client = createClient({
  baseUrl: 'https://your-app.region.insforge.app',  // Your InsForge backend URL
  anonKey: 'your-anon-key-here'       // Get this from backend metadata
});

```

**API BASE URL**: Your API base URL is `https://your-app.region.insforge.app`.

## Getting Detailed Documentation

### 🚨 CRITICAL: Always Fetch Documentation Before Writing Code

InsForge provides official SDKs and REST APIs, use them to interact with InsForge services from your application code.

- [TypeScript SDK](/sdks/typescript/overview) - JavaScript/TypeScript
- [Swift SDK](/sdks/swift/overview) - iOS, macOS, tvOS, and watchOS
- [Kotlin SDK](/sdks/kotlin/overview) - Android and Kotlin Multiplatform
- [REST API](/sdks/rest/overview) - Direct HTTP API access

Before writing or editing any InsForge integration code, you **MUST** call the `fetch-docs` or `fetch-sdk-docs` MCP tool to get the latest SDK documentation. This ensures you have accurate, up-to-date implementation patterns.

### Use the InsForge `fetch-docs` MCP tool to get specific SDK documentation:

Available documentation types:

- `"instructions"` - Essential backend setup (START HERE)
- `"real-time"` - Real-time pub/sub (database + client events) via WebSockets
- `"db-sdk-typescript"` - Database operations with TypeScript SDK
- **Authentication** - Choose based on implementation:
  - `"auth-sdk-typescript"` - TypeScript SDK methods for custom auth flows
  - `"auth-components-react"` - Pre-built auth UI for React+Vite (singlepage App)
  - `"auth-components-react-router"` - Pre-built auth UI for React(Vite+React Router) (Multipage App)
  - `"auth-components-nextjs"` - Pre-built auth UI for Nextjs (SSR App)
- `"storage-sdk"` - File storage operations
- `"functions-sdk"` - Serverless functions invocation
- `"ai-integration-sdk"` - AI chat and image generation
- `"real-time"` - Real-time pub/sub (database + client events) via WebSockets
- `"deployment"` - Deploy frontend applications via MCP tool

These documentations are mostly for TypeScript SDK. For other languages, you can also use `fetch-sdk-docs` mcp tool to get specific documentation.

### Use the InsForge `fetch-sdk-docs` MCP tool to get specific SDK documentation

You can fetch sdk documentation using the `fetch-sdk-docs` MCP tool with specific feature type and language.

Available feature types:
- db - Database operations
- storage - File storage operations
- functions - Serverless functions invocation
- auth - User authentication
- ai - AI chat and image generation
- realtime - Real-time pub/sub (database + client events) via WebSockets

Available languages:
- typescript - JavaScript/TypeScript SDK
- swift - Swift SDK (for iOS, macOS, tvOS, and watchOS)
- kotlin - Kotlin SDK (for Android and JVM applications)
- rest-api - REST API

## When to Use SDK vs MCP Tools

### Always SDK for Application Logic:

- Authentication (register, login, logout, profiles)
- Database CRUD (select, insert, update, delete)
- Storage operations (upload, download files)
- AI operations (chat, image generation)
- Serverless function invocation

### Use MCP Tools for Infrastructure:

- Project scaffolding (`download-template`) - Download starter templates with InsForge integration
- Backend setup and metadata (`get-backend-metadata`)
- Database schema management (`run-raw-sql`, `get-table-schema`)
- Storage bucket creation (`create-bucket`, `list-buckets`, `delete-bucket`)
- Serverless function deployment (`create-function`, `update-function`, `delete-function`)
- Frontend deployment (`create-deployment`) - Deploy frontend apps to InsForge hosting

## Important Notes

- For auth: use `auth-sdk` for custom UI, or framework-specific components for pre-built UI
- SDK returns `{data, error}` structure for all operations
- Database inserts require array format: `[{...}]`
- Serverless functions have single endpoint (no subpaths)
- Storage: Upload files to buckets, store URLs in database
- AI operations are OpenAI-compatible
- **EXTRA IMPORTANT**: Use Tailwind CSS 3.4 (do not upgrade to v4). Lock these dependencies in `package.json`

<claude-mem-context>
# Memory Context

# [NexusOp 2.0 Node.Js Backend] recent context, 2026-04-25 9:53am GMT+5:30

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 15 obs (6,778t read) | 169,637t work | 96% savings

### Apr 24, 2026
S3 Apply Impersonation to Existing Bash Command in Worktree (Apr 24 at 10:12 AM)
S1 Apply Impersonation to Existing Bash Command in Worktree (Apr 24 at 10:12 AM)
S4 Understanding Caveman Help Request (Apr 24 at 10:14 AM)
S9 Code error search across NexusOp 2.0 Node.js Backend — async subagents launched to scan all JS files (Apr 24 at 10:17 AM)
9 10:22a 🟣 Claude Code Agent Launched
S12 User invoked caveman mode (Apr 24 at 5:17 PM)
### Apr 25, 2026
10 9:26a 🔵 NexusOps Backend PRD/TRD Gap Analysis Completed
11 " ⚖️ NexusOps Next Phase: Implement All P0/P1 Missing Features
13 " 🔵 NexusOps Backend Full Code Audit: Actual Implementation State Confirmed
14 " 🔵 autofix.service.js Full Implementation: Pipeline, Safety, and Missing GitHub Layer
15 " 🔵 memory.service.js Full Implementation: PDF+Text Only, pgvector-backed, No Telegram/Whisper/DOCX
19 9:29a 🟣 github.service.js Created: Full Octokit Integration for Code Fetch and Draft PRs
20 " 🟣 telegram.service.js Created: Webhook-Based Telegram Message Ingestion into Memory
21 9:30a 🟣 jira.service.js Created: Atlassian REST API v3 Task Sync
22 " 🟣 dashboard.service.js Created: Unified Stats, Timeline, and Incident Time Series
23 " 🟣 Dashboard Controller and Route Created: Stats, Timeline, Time Series Now Exposed via HTTP
26 9:31a 🟣 memory.service.js Massively Upgraded: DOCX, Whisper, Task Detection, and Incident Indexing
27 " 🟣 autofix.service.js Wired to GitHub: Real Code Fetch Now Feeds Fix Generation
S20 Caveman mode activation — user invoked caveman skill to enable compressed communication mode (Apr 25 at 9:37 AM)
28 9:40a 🔵 Token Optimizer Multi-Agent Audit Architecture Revealed
29 9:42a 🔵 Claude Config State — No CLAUDE.md Anywhere, MEMORY.md Only in Antigravity Project

Access 170k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>