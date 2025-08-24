import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import fetch from "node-fetch";
import { extractFromPDF, extractFromImage, upsertChunks } from "../lib/rag";

async function downloadToTmp(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const tmp = path.join(os.tmpdir(), `ingest-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.writeFile(tmp, buf);
  return tmp;
}

async function run() {
  const inputs = process.argv.slice(2);
  if (inputs.length === 0) {
    console.error("Usage: ts-node scripts/ingest.ts <filePathOrUrl1> <file2> ...");
    process.exit(1);
  }
  for (const inpt of inputs) {
    let filePath = inpt;
    let source = path.basename(inpt);
    let url: string | undefined = undefined;

    if (inpt.startsWith("http://") || inpt.startsWith("https://")) {
      url = inpt;
      filePath = await downloadToTmp(inpt);
    }

    const ext = path.extname(source).toLowerCase();
    let chunks: any[] = [];
    if ([".pdf"].includes(ext)) chunks = await extractFromPDF(filePath, source, url);
    else if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) chunks = await extractFromImage(filePath, source, url);
    else {
      console.warn(`Skipping unsupported: ${source}`);
      continue;
    }
    await upsertChunks(chunks);
    console.log(`Ingested ${chunks.length} chunks from ${source}`);
  }
}

run();
