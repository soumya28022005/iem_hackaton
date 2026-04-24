const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings, ChatOpenAI } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { ChatGroq } = require("@langchain/groq");

// In-memory store for demonstration. In production, use Pinecone, Postgres, MongoDB, etc.
let vectorStore = null;

async function getVectorStore() {
    if (!vectorStore) {
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        vectorStore = new MemoryVectorStore(embeddings);
    }
    return vectorStore;
}

/**
 * Ingests a document from the filesystem, splits it, and stores embeddings.
 */
async function ingestDocument(filePath, originalName, mimeType, metadata = {}) {
    let loader;
    if (mimeType === 'application/pdf') {
        loader = new PDFLoader(filePath);
    } else {
        loader = new TextLoader(filePath);
    }

    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const splitDocs = await textSplitter.splitDocuments(docs);
    
    // Attach metadata
    const docsWithMetadata = splitDocs.map(doc => {
        doc.metadata = { ...doc.metadata, ...metadata, source: originalName };
        return doc;
    });

    const store = await getVectorStore();
    await store.addDocuments(docsWithMetadata);

    return { chunksAdded: docsWithMetadata.length, source: originalName };
}

/**
 * Queries the knowledge base using the Groq LLM and retrieved context.
 */
async function queryKnowledgeBase(question, filter = null) {
    const store = await getVectorStore();
    
    // Choose LLM. Using Groq from environment settings
    const llm = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || "llama3-70b-8192",
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
        Answer the following question based only on the provided context.
        If you don't know the answer based on the context, say so.
        
        <context>
        {context}
        </context>

        Question: {input}
    `);

    const combineDocsChain = await createStuffDocumentsChain({
        llm,
        prompt,
    });

    const retriever = store.asRetriever(filter ? { filter } : undefined);

    const retrievalChain = await createRetrievalChain({
        combineDocsChain,
        retriever,
    });

    const response = await retrievalChain.invoke({
        input: question,
    });

    return response.answer;
}

module.exports = {
    ingestDocument,
    queryKnowledgeBase
};
