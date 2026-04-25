# Backend File Structure Walkthrough

The NexusOp 2.0 backend has been refactored to follow a clean **Controller-Service-Route** architecture. This ensures better separation of concerns, easier testing, and a more professional codebase.

## System Architecture

```mermaid
graph TD
    Client[Client / Frontend] --> Routes["API Routes (src/routes)"]
    Routes --> Middleware["Middleware (src/middleware)"]
    Middleware --> Controllers["Controllers (src/controllers)"]
    Controllers --> Services["Services (src/services)"]
    
    subgraph "External & Infrastructure"
        Services --> Prisma["Prisma ORM (Database)"]
        Services --> Groq["Groq / OpenAI (AI Engines)"]
        Services --> Redis["Redis (BullMQ)"]
    end
    
    Redis -.-> Workers["Background Workers (src/workers)"]
    Workers --> Services
```

## Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Routes
    participant M as Middleware (Auth)
    participant Ctrl as Controller
    participant S as Service
    participant DB as Database (Prisma)

    C->>R: HTTP Request (e.g., POST /auth/login)
    R->>M: verifyAuth / Validation
    M-->>R: Authorized User Context
    R->>Ctrl: Controller Method
    Ctrl->>Ctrl: Zod Input Validation
    Ctrl->>S: Service Call (Business Logic)
    S->>DB: DB / External API Ops
    DB-->>S: Data Result
    S-->>Ctrl: Business Model
    Ctrl-->>C: HTTP Response (JSON)
```

## Directory Overview

```text
src/
├── config/             # Configuration (Firebase, environment)
├── controllers/        # HTTP Handlers (Logic for specific routes)
│   ├── auth.controller.js
│   ├── autofix.controller.js
│   ├── memory.controller.js
│   ├── workspace.controller.js
│   └── webhook.controller.js
├── lib/                # Core libraries (Prisma, Redis, HTTP helpers)
├── middleware/         # Express middleware (Auth, Error handling)
├── routes/             # Route definitions (Points to controllers)
├── services/           # Business Logic (Database & AI interactions)
│   ├── auth.service.js
│   ├── autofix.service.js
│   ├── memory.service.js
│   ├── rag.service.js
│   ├── vector.service.js
│   └── workspace.service.js
├── utils/              # Shared helper functions
├── workers/            # Background processing (BullMQ)
└── index.js            # API Entry point
```

## Key Changes Made

### 1. Separation of Concerns
Previously, route files contained a mix of validation, business logic, and HTTP handling. Now:
- **Routes** only define the endpoint and call a controller method.
- **Controllers** validate the request body (using Zod) and send the response.
- **Services** perform the actual data fetching or AI processing.

### 2. Standardized Naming
All service files now use the `.service.js` suffix for consistency (e.g., `autofix.service.js`).

### 3. Flattened Services
Deeply nested services (like `src/services/memory/memory.service.js`) were moved to the top-level `src/services/` to simplify imports.

### 4. Code Cleanup
Empty and redundant directories were removed to reduce clutter in the project tree.

## How to proceed
- You can continue development by adding new features to the respective `service` and exposing them via `controller` and `route`.
- Run `npm run check` to verify syntax across all files.
- Run `npm run dev` to start the development server.
