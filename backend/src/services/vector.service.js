const { OpenAIEmbeddings } = require('@langchain/openai');
const { prisma } = require('../lib/prisma');
const { config } = require('../lib/config');

let embeddings;

function getEmbeddings() {
  const isValidKey = config.OPENAI_API_KEY && config.OPENAI_API_KEY !== 'your-openai-api-key-here';
  if (!isValidKey) return null;
  if (!embeddings) {
    embeddings = new OpenAIEmbeddings({
      modelName: config.OPENAI_BASE_URL?.includes('openrouter') 
        ? 'openai/text-embedding-3-small' 
        : 'text-embedding-3-small',
      openAIApiKey: config.OPENAI_API_KEY,
      configuration: {
        baseURL: config.OPENAI_BASE_URL,
      },
    });
  }
  return embeddings;
}

function toVectorLiteral(values) {
  return `[${values.map((value) => Number(value).toFixed(8)).join(',')}]`;
}

async function embedDocuments(texts) {
  const client = getEmbeddings();
  if (!client) return [];
  try {
    return await client.embedDocuments(texts);
  } catch (error) {
    console.error('[Vector Service] embedDocuments error:', error.message);
    return [];
  }
}

async function embedQuery(text) {
  const client = getEmbeddings();
  if (!client) return null;
  try {
    return await client.embedQuery(text);
  } catch (error) {
    console.error('[Vector Service] embedQuery error:', error.message);
    return null;
  }
}

async function insertChunkWithEmbedding({ workspaceId, sourceId, chunkIndex, text, embedding, metadata }) {
  if (!embedding) {
    return prisma.documentChunk.create({
      data: {
        workspace_id: workspaceId,
        source_id: sourceId,
        chunk_index: chunkIndex,
        text,
        metadata,
        source_type: metadata.source_type || metadata.sourceType || 'document',
        sender: metadata.sender || null,
        channel_name: metadata.channel_name || null,
        timestamp: metadata.timestamp ? new Date(metadata.timestamp) : null,
      },
    });
  }

  const vector = toVectorLiteral(embedding);
  const rows = await prisma.$queryRawUnsafe(
    `INSERT INTO document_chunks
      (workspace_id, source_id, chunk_index, text, embedding, metadata, source_type, sender, channel_name, timestamp)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5::vector, $6::jsonb, $7, $8, $9, $10)
     RETURNING id, source_id, text, metadata, created_at`,
    workspaceId,
    sourceId,
    chunkIndex,
    text,
    vector,
    JSON.stringify(metadata || {}),
    metadata.source_type || metadata.sourceType || 'document',
    metadata.sender || null,
    metadata.channel_name || null,
    metadata.timestamp ? new Date(metadata.timestamp) : null,
  );

  return rows[0];
}

async function similaritySearch(workspaceId, query, limit = 5) {
  const embedding = await embedQuery(query);

  if (!embedding) {
    const rows = await prisma.documentChunk.findMany({
      where: {
        workspace_id: workspaceId,
        text: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    return rows.map((row) => ({ ...row, score: 0 }));
  }

  const vector = toVectorLiteral(embedding);
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, source_id, text, metadata, source_type, sender, timestamp, channel_name,
            1 - (embedding <=> $2::vector) AS score
       FROM document_chunks
      WHERE workspace_id = $1::uuid
        AND embedding IS NOT NULL
      ORDER BY embedding <=> $2::vector
      LIMIT $3`,
    workspaceId,
    vector,
    limit,
  );

  return rows.map((row) => ({
    ...row,
    score: Number(row.score || 0),
  }));
}

module.exports = {
  embedDocuments,
  embedQuery,
  insertChunkWithEmbedding,
  similaritySearch,
};
