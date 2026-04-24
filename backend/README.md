# NexusOps Node.js Backend

This is the Node.js port of the NexusOps backend, incorporating **RAG (Retrieval-Augmented Generation)** and **LangChain**.

## Features implemented:
- **Express.js Server**: Configured with CORS, JSON parsing, and dotenv for environment variables.
- **LangChain RAG Pipeline**:
  - `src/services/rag.js`: Implements Document loading (PDF/TXT), Text Splitting, OpenAI Embeddings, Memory VectorStore, and a Retrieval QA Chain using the Groq API (as defined in your Python `.env`).
  - `src/routes/memory.js`: Endpoints for ingesting documents (`POST /api/v1/memory/ingest`) and querying the knowledge base (`POST /api/v1/memory/query`).
  
## Getting Started

Due to a temporary network issue during setup, you will need to install the newly added dependencies:

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   The `.env` file from the previous Python backend has been copied here automatically. 
   - Ensure `GROQ_API_KEY` and `OPENAI_API_KEY` are valid.
   - We updated `DATABASE_URL` to be a valid PostgreSQL connection string compatible with Prisma.
   - For Firebase, download your Service Account Key and either point `GOOGLE_APPLICATION_CREDENTIALS` to the JSON file, set `FIREBASE_SERVICE_ACCOUNT_JSON` to the full JSON payload, or set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.

3. **Database Setup (Prisma & PostgreSQL):**
   We have defined your `User` and `Workspace` schema inside `prisma/schema.prisma`. 
   To push the schema to your Postgres database and generate the client, run:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Run Server:**
   ```bash
   npm run dev
   ```

## What's Next?
- **Auth:** The `/api/v1/user/me` endpoint in `src/index.js` shows how Firebase authentication validates a JWT and synchronizes with your Prisma PostgreSQL database automatically.
- **RAG:** You can use the `/api/v1/memory/ingest` and `/api/v1/memory/query` endpoints utilizing LangChain.
- **AutoFix:** The GitHub integration and AutoFix logic (Repos, Incidents) are the last piece remaining to be ported from Python.
