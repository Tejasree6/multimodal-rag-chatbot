import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import os from "node:os";
import path from "node:path";
import { extractFromPDF, extractFromImage, upsertChunks } from "@/lib/rag";

export const runtime = "nodejs";

async function downloadToTmp(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const tmp = path.join(os.tmpdir(), `ingest-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.writeFile(tmp, buf);
  return tmp;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const filePath = await downloadToTmp(url);
    const source = url.split("/").pop() || "blob-file";
    const ext = path.extname(source).toLowerCase();

    let chunks: any[] = [];
    if ([".pdf"].includes(ext)) chunks = await extractFromPDF(filePath, source, url);
    else if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) chunks = await extractFromImage(filePath, source, url);
    else return NextResponse.json({ error: `Unsupported file type: ${ext}` }, { status: 400 });

    await upsertChunks(chunks);
    return NextResponse.json({ ok: true, chunks: chunks.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
