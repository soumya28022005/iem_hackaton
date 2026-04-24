CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

ALTER TABLE document_chunks
  ADD COLUMN IF NOT EXISTS text_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', text)) STORED;

CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON document_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_chunks_fts
  ON document_chunks USING GIN (text_tsv);

CREATE INDEX IF NOT EXISTS idx_chunks_workspace
  ON document_chunks(workspace_id);

CREATE INDEX IF NOT EXISTS idx_chunks_source
  ON document_chunks(source_id);
