import OpenAI from "openai";
import Groq from "groq-sdk";

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  return new OpenAI({ apiKey });
}

export function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");
  return new Groq({ apiKey });
}

export const MODELS = {
  textVision: "gpt-4o-mini",
  groqText: "llama-3.1-70b-versatile",
  embedding: "text-embedding-3-small",
  image: "gpt-image-1",
} as const;
