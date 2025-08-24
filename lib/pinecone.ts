import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
export const index = pc.index(process.env.PINECONE_INDEX!);

export type Vec = number[];

export async function upsertVectors(
  vectors: { id: string; values: Vec; metadata?: Record<string, any> }[]
) {
  await index.upsert(vectors);
}

export async function similaritySearch(query: Vec, topK = 5) {
  const res = await index.query({
    vector: query,
    topK,
    includeMetadata: true,
  });
  return res.matches ?? [];
}
