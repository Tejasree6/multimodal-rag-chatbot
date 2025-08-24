import { NextRequest } from "next/server";
import { getOpenAI, getGroq, MODELS } from "@/lib/aiProviders";
import { embed } from "@/lib/embeddings";
import { similaritySearch } from "@/lib/pinecone";

export const runtime = "edge";

type Msg = { role: "user"|"assistant"|"system"; content: any };

function toReadableStream(text: string) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    }
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, useRag = true, provider = "openai" } = body as {
    messages: Msg[];
    useRag?: boolean;
    provider?: "openai" | "groq";
  };

  let ragContext = "";
  if (useRag) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const userTextOnly = Array.isArray(lastUser?.content)
      ? lastUser!.content.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n")
      : (lastUser?.content ?? "");

    if (userTextOnly) {
      const [qvec] = await embed([userTextOnly]);
      const matches = await similaritySearch(qvec, 6);
      ragContext = matches
        .map((m: any) => `Source: ${m.metadata?.source}${m.metadata?.page ? ` (p.${m.metadata.page})` : ""}${m.metadata?.url ? `\nURL: ${m.metadata.url}` : ""}\n${m.metadata?.text}`)
        .join("\n---\n");
    }
  }

  const systemPrompt = useRag && ragContext
    ? `You are a helpful assistant. Use the CONTEXT to answer. If unsure, say so.\n\nCONTEXT:\n${ragContext}`
    : `You are a helpful assistant.`;

  if (provider === "groq") {
    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: MODELS.groqText,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages as any[],
      ],
      temperature: 0.4,
      max_tokens: 800,
    });
    const text = completion.choices?.[0]?.message?.content ?? "";
    return new Response(toReadableStream(text), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: MODELS.textVision,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages as any[],
    ],
    temperature: 0.4,
    max_tokens: 800,
  });

  const text = completion.choices?.[0]?.message?.content ?? "";
  return new Response(toReadableStream(text), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
