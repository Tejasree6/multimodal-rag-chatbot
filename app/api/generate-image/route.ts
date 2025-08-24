import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, MODELS } from "@/lib/aiProviders";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const openai = getOpenAI();
  const res = await openai.images.generate({
    model: MODELS.image,
    prompt,
    size: "1024x1024",
  });
  const b64 = res.data[0].b64_json!;
  return NextResponse.json({ imageBase64: b64 });
}
