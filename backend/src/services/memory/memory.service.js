const fs = require('fs/promises');
const pdf = require('pdf-parse');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { ChatGroq } = require('@langchain/groq');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { prisma } = require('../../lib/prisma');
const { config } = require('../../lib/config');
const { AppError } = require('../../lib/http');
const { embedDocuments, insertChunkWithEmbedding, similaritySearch } = require('./vector.service');

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 150,
  separators: ['\n\n', '\n', '. ', '! ', '? ', ' '],
});

async function extractTextFromFile(file) {
  const buffer = await fs.readFile(file.path);
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    const parsed = await pdf(buffer);
    return parsed.text;
  }
  return buffer.toString('utf8');
}

async function createSource({ workspaceId, name, sourceType = 'document', metadata = {}, content }) {
  return prisma.source.create({
    data: {
      workspace_id: workspaceId,
      name,
      source_type: sourceType,
      status: content ? 'processing' : 'pending',
      metadata,
    },
  });
}

async function ingestText({ workspaceId, name, sourceType = 'document', text, metadata = {} }) {
  if (!text || !text.trim()) {
    throw new AppError(400, 'No text content found to ingest');
  }

  const source = await createSource({
    workspaceId,
    name,
    sourceType,
    metadata,
    content: text,
  });

  try {
    const docs = await splitter.createDocuments([text], [{
      ...metadata,
      workspace_id: workspaceId,
      source_id: source.id,
      source_type: sourceType,
    }]);
    const texts = docs.map((doc) => doc.pageContent);
    const embeddings = await embedDocuments(texts);

    for (let index = 0; index < docs.length; index += 1) {
      await insertChunkWithEmbedding({
        workspaceId,
        sourceId: source.id,
        chunkIndex: index,
        text: docs[index].pageContent,
        embedding: embeddings[index],
        metadata: docs[index].metadata,
      });
    }

    return prisma.source.update({
      where: { id: source.id },
      data: {
        status: 'processed',
        processed_at: new Date(),
      },
    });
  } catch (error) {
    await prisma.source.update({
      where: { id: source.id },
      data: {
        status: 'failed',
        error_message: error.message,
      },
    });
    throw error;
  }
}

async function ingestFile({ workspaceId, file, metadata = {} }) {
  const text = await extractTextFromFile(file);
  return ingestText({
    workspaceId,
    name: file.originalname,
    sourceType: metadata.source_type || metadata.sourceType || 'document',
    text,
    metadata: {
      ...metadata,
      original_name: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    },
  });
}

async function answerWithGroq(question, chunks) {
  if (!chunks.length) {
    return "I couldn't find this in your team's records.";
  }

  if (!config.GROQ_API_KEY) {
    const preview = chunks[0].text.slice(0, 350);
    return `I found relevant context, but GROQ_API_KEY is not configured. Top match: ${preview}`;
  }

  const llm = new ChatGroq({
    apiKey: config.GROQ_API_KEY,
    model: config.GROQ_MODEL,
  });

  const prompt = ChatPromptTemplate.fromTemplate(`
You are NexusOps Memory, an intelligent knowledge assistant for engineering teams.
Answer based only on the provided context. If the answer is not present, say: "I couldn't find this in your team's records."
Cite sources compactly when possible.

Context:
{context}

Question: {question}
`);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({
    question,
    context: chunks.map((chunk, index) => `[${index + 1}] ${chunk.text}`).join('\n\n'),
  });

  return response.content || String(response);
}

async function queryMemory({ workspaceId, question, userId }) {
  const startedAt = Date.now();
  const chunks = await similaritySearch(workspaceId, question, 8);
  const filtered = chunks.filter((chunk) => !chunk.score || chunk.score >= 0.6).slice(0, 5);
  const answer = await answerWithGroq(question, filtered);

  const sources = filtered.slice(0, 3).map((chunk) => ({
    id: chunk.id,
    source_id: chunk.source_id,
    content: chunk.text,
    text: chunk.text,
    metadata: chunk.metadata || {},
    score: chunk.score,
  }));

  await prisma.queryHistory.create({
    data: {
      workspace_id: workspaceId,
      user_id: userId || null,
      question,
      answer,
      sources,
      latency_ms: Date.now() - startedAt,
      model_used: config.GROQ_MODEL,
    },
  }).catch(() => null);

  return { answer, sources };
}

module.exports = {
  createSource,
  ingestFile,
  ingestText,
  queryMemory,
  similaritySearch,
};
