# Multimodal RAG Chatbot — Vercel Ready

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<REPLACE_WITH_YOUR_REPO_URL>&project-name=multimodal-rag-chatbot&repository-name=multimodal-rag-chatbot&env=OPENAI_API_KEY,PINECONE_API_KEY,PINECONE_INDEX,GROQ_API_KEY&envDescription=Set%20your%20API%20keys%20and%20Pinecone%20index%20name&envLink=.)



## Features
- Chat with **RAG** (Pinecone) over PDFs **and** images (OCR).
- **Vision input**: attach images to analyze in chat.
- **Image generation** via OpenAI Images API.
- **Vercel Blob** for uploads (Edge Runtime).
- Optional **Groq** provider for text-only path.
- Ingestion route (`/api/ingest`) to index Blob files into Pinecone.

## 1) Local Setup

```bash
npm install
cp .env.example .env.local
# fill in vars, then:
npm run dev
# open http://localhost:3000
```

## 2) Environment Variables

```
OPENAI_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX=docs-multimodal
# Optional
# GROQ_API_KEY=
# For private blobs, you can add BLOB_READ_WRITE_TOKEN; public uploads don't require it here.
```

Create a Pinecone index (dimension **1536**, metric **cosine**).

## 3) Upload + Ingest (Vercel Blob)

- Upload files in the UI (PDF/JPG/PNG/WebP).  
- If **Auto-ingest** is on, the app calls `/api/ingest` to index the uploaded Blob URL in Pinecone automatically.

You can also ingest URLs manually:

```bash
npx ts-node scripts/ingest.ts https://your-public-blob-url/file.pdf
```

## 4) Deploy to Vercel

1. Push this project to GitHub.
2. Replace `<REPLACE_WITH_YOUR_REPO_URL>` in the Deploy button at the top of this README.
3. Click the button (or import the repo in the Vercel dashboard).
4. Set environment variables during setup.

## 5) Notes

- `/api/chat`, `/api/upload`, `/api/generate-image` run on **Edge**; `/api/ingest` runs on **Node.js** with more resources.
- For large docs, consider a queue/cron-based ingestion worker.
