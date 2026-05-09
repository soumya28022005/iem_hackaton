-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "avatar_url" TEXT,
    "github_id" VARCHAR(100),
    "github_username" VARCHAR(100),
    "github_access_token" TEXT,
    "google_id" VARCHAR(100),
    "google_access_token" TEXT,
    "hashed_password" TEXT,
    "provider" VARCHAR(50) NOT NULL DEFAULT 'email',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "owner_id" UUID NOT NULL,
    "telegram_chat_id" VARCHAR(100),
    "jira_project_key" VARCHAR(50),
    "jira_base_url" TEXT,
    "default_branch" VARCHAR(100) NOT NULL DEFAULT 'main',
    "auto_revert_enabled" BOOLEAN NOT NULL DEFAULT false,
    "error_rate_threshold" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "revert_window_min" INTEGER NOT NULL DEFAULT 5,
    "notify_telegram_chat_id" VARCHAR(100),
    "notify_on_pr" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_revert" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_task" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "source_type" VARCHAR(50) NOT NULL,
    "name" VARCHAR(500),
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "file_url" TEXT,
    "file_size_bytes" BIGINT,
    "duration_seconds" INTEGER,
    "external_id" VARCHAR(255),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sender" VARCHAR(255),
    "timestamp" TIMESTAMP(3),
    "source_type" VARCHAR(50),
    "channel_name" VARCHAR(255),
    "incident_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_history" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "latency_ms" INTEGER,
    "model_used" VARCHAR(100),
    "feedback" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'detected',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "assignee_hint" VARCHAR(255),
    "deadline_hint" TEXT,
    "source_chunk_id" UUID,
    "source_preview" TEXT,
    "jira_ticket_key" VARCHAR(50),
    "jira_synced_at" TIMESTAMP(3),
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "status" VARCHAR(30) NOT NULL DEFAULT 'open',
    "first_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "related_chunk_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repositories" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "github_repo_id" BIGINT,
    "full_name" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "default_branch" VARCHAR(100) NOT NULL DEFAULT 'main',
    "branch" VARCHAR(100) NOT NULL DEFAULT 'main',
    "provider" VARCHAR(50) NOT NULL DEFAULT 'github',
    "language" VARCHAR(50),
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "webhook_id" BIGINT,
    "github_token" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "repository_id" UUID,
    "raw_error" TEXT,
    "raw_stack_trace" TEXT,
    "sanitized_error" TEXT,
    "sanitized_stack_trace" TEXT,
    "sanitization_report" JSONB NOT NULL DEFAULT '{}',
    "error_type" VARCHAR(255),
    "error_message" TEXT,
    "stack_trace" TEXT,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "environment" VARCHAR(50) NOT NULL DEFAULT 'production',
    "branch" VARCHAR(100) NOT NULL DEFAULT 'main',
    "source" VARCHAR(50) NOT NULL DEFAULT 'manual',
    "external_id" VARCHAR(255),
    "root_cause" TEXT,
    "affected_files" JSONB NOT NULL DEFAULT '[]',
    "analysis_confidence" DOUBLE PRECISION,
    "analysis_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "memory_context" JSONB,
    "pr_url" TEXT,
    "pr_number" INTEGER,
    "pr_branch" VARCHAR(255),
    "pr_created_at" TIMESTAMP(3),
    "pr_merged_at" TIMESTAMP(3),
    "status" VARCHAR(30) NOT NULL DEFAULT 'received',
    "pipeline_error" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixes" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL DEFAULT 'Proposed fix',
    "explanation" TEXT,
    "diff" TEXT,
    "confidence" DOUBLE PRECISION,
    "caveats" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "file_changes" JSONB NOT NULL DEFAULT '[]',
    "safety_score" VARCHAR(30),
    "safety_issues" JSONB NOT NULL DEFAULT '[]',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,
    "model_used" VARCHAR(100),
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "pr_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revert_events" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "incident_id" UUID,
    "trigger_type" VARCHAR(50) NOT NULL,
    "reason" TEXT,
    "bad_deploy_id" VARCHAR(255),
    "reverted_to" VARCHAR(255),
    "platform" VARCHAR(50),
    "status" VARCHAR(30) NOT NULL,
    "error_message" TEXT,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "revert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_rate_snapshots" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "deploy_id" VARCHAR(255),
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_rate_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID,
    "module" VARCHAR(30) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(50),
    "resource_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_github_id_key" ON "users"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspace_id_user_id_key" ON "workspace_members"("workspace_id", "user_id");

-- CreateIndex
CREATE INDEX "sources_workspace_id_idx" ON "sources"("workspace_id");

-- CreateIndex
CREATE INDEX "sources_status_idx" ON "sources"("status");

-- CreateIndex
CREATE INDEX "sources_source_type_idx" ON "sources"("source_type");

-- CreateIndex
CREATE INDEX "document_chunks_workspace_id_idx" ON "document_chunks"("workspace_id");

-- CreateIndex
CREATE INDEX "document_chunks_source_id_idx" ON "document_chunks"("source_id");

-- CreateIndex
CREATE INDEX "query_history_workspace_id_created_at_idx" ON "query_history"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "tasks_workspace_id_idx" ON "tasks"("workspace_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "problems_workspace_id_idx" ON "problems"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_github_repo_id_key" ON "repositories"("github_repo_id");

-- CreateIndex
CREATE INDEX "repositories_workspace_id_idx" ON "repositories"("workspace_id");

-- CreateIndex
CREATE INDEX "repositories_full_name_idx" ON "repositories"("full_name");

-- CreateIndex
CREATE INDEX "incidents_workspace_id_idx" ON "incidents"("workspace_id");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");

-- CreateIndex
CREATE INDEX "incidents_created_at_idx" ON "incidents"("created_at");

-- CreateIndex
CREATE INDEX "fixes_incident_id_idx" ON "fixes"("incident_id");

-- CreateIndex
CREATE INDEX "error_rate_snapshots_workspace_id_recorded_at_idx" ON "error_rate_snapshots"("workspace_id", "recorded_at");

-- CreateIndex
CREATE INDEX "activity_log_workspace_id_created_at_idx" ON "activity_log"("workspace_id", "created_at");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_history" ADD CONSTRAINT "query_history_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_history" ADD CONSTRAINT "query_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_source_chunk_id_fkey" FOREIGN KEY ("source_chunk_id") REFERENCES "document_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problems" ADD CONSTRAINT "problems_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixes" ADD CONSTRAINT "fixes_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixes" ADD CONSTRAINT "fixes_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revert_events" ADD CONSTRAINT "revert_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_rate_snapshots" ADD CONSTRAINT "error_rate_snapshots_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
