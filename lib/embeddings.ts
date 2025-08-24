import { getOpenAI, MODELS } from "./aiProviders";

export async function embed(texts: string[]) {
  const openai = getOpenAI();
  const res = await openai.embeddings.create({
    model: MODELS.embedding,
    input: texts,
  });
  return res.data.map((d: any) => d.embedding);
}
