import fs from "node:fs/promises";
import path from "node:path";
import pdf from "pdf-parse";
import Tesseract from "tesseract.js";
import sharp from "sharp";
import { embed } from "./embeddings";
import { upsertVectors } from "./pinecone";

export type DocChunk = {
  id: string;
  text: string;
  source: string;
  page?: number;
  url?: string;
};

export function chunkText(text: string, max = 800, overlap = 100): string[] {
  const parts: string[] = [];
  let i = 0;
  while (i < text.length) {
    parts.push(text.slice(i, i + max));
    i += max - overlap;
  }
  return parts.map((t) => t.trim()).filter(Boolean);
}

export async function extractFromPDF(filePath: string, source: string, url?: string) {
  const data = await fs.readFile(filePath);
  const parsed = await pdf(data);
  const pages = parsed.text.split("\n\f");
  const chunks: DocChunk[] = [];
  for (let p = 0; p < pages.length; p++) {
    const pageText = pages[p];
    for (const c of chunkText(pageText)) {
      chunks.push({ id: `${source}-p${p}-${c.slice(0,16)}`, text: c, source, page: p + 1, url });
    }
  }
  return chunks;
}

export async function extractFromImage(filePath: string, source: string, url?: string) {
  const buf = await sharp(filePath).resize(1600).grayscale().toBuffer();
  const { data: { text } } = await (Tesseract as any).recognize(buf, "eng");
  const chunks = chunkText(text);
  return chunks.map((t, i) => ({ id: `${source}-img-${i}`, text: t, source, url }));
}

export async function upsertChunks(chunks: DocChunk[]) {
  const vectorsInput = chunks.map((c) => c.text);
  const embs = await embed(vectorsInput);
  await upsertVectors(
    embs.map((values, i) => ({ id: chunks[i].id, values, metadata: chunks[i] }))
  );
}
