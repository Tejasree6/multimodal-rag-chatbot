"use client";
import { useState, useRef } from "react";
import "./globals.css";

type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [useRag, setUseRag] = useState(true);
  const [autoIngest, setAutoIngest] = useState(true);
  const [imgPrompt, setImgPrompt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function sendMessage() {
    const content: Part[] = [];
    if (input) content.push({ type: "text", text: input });
    if (image) content.push({ type: "image_url", image_url: { url: image } });

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages, useRag }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    setMessages((prev) => [...prev, { role: "assistant", content: [{ type: "text", text: "" }] }]);

    if (!reader) return;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      acc += decoder.decode(value);
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        last.content[0].text = acc;
        return copy;
      });
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    setImage(json.url);

    if (autoIngest) {
      await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: json.url }),
      });
    }
  }

  async function genImage() {
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: imgPrompt }),
    });
    const { imageBase64 } = await res.json();
    const url = `data:image/png;base64,${imageBase64}`;
    setMessages((m) => [...m, { role: "assistant", content: [{ type: "image_url", image_url: { url } }] }]);
  }

  return (
    <main className="container">
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 8}}>
        <h1 style={{fontWeight:700, fontSize: "22px"}}>Multimodal RAG Chat</h1>
        <span className="badge">Vercel-ready</span>
      </div>

      <div className="card" style={{display: "flex", gap: 8, alignItems: "center"}}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything… you can also attach an image"
          style={{flex: 1}}
        />
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} />
        <button className="ghost" onClick={() => fileRef.current?.click()}>Attach</button>
        <label style={{display:"flex", gap:6, alignItems:"center", fontSize: 12}}>
          <input type="checkbox" checked={useRag} onChange={(e) => setUseRag(e.target.checked)} />
          Use RAG
        </label>
        <label style={{display:"flex", gap:6, alignItems:"center", fontSize: 12}}>
          <input type="checkbox" checked={autoIngest} onChange={(e) => setAutoIngest(e.target.checked)} />
          Auto-ingest
        </label>
        <button className="primary" onClick={sendMessage}>Send</button>
      </div>

      {image && (
        <div style={{fontSize: 12, marginTop: 6}}>
          Attached/Uploaded: <a href={image} target="_blank">{image}</a>
        </div>
      )}

      <div style={{display:"flex", flexDirection:"column", gap:12, marginTop: 12}}>
        {messages.map((m, i) => (
          <div key={i} className="card">
            <div className="role">{m.role}</div>
            {Array.isArray(m.content) ? (
              m.content.map((p: any, idx: number) => (
                p.type === "text" ? (
                  <p key={idx} className="message">{p.text}</p>
                ) : (
                  <img key={idx} src={p.image_url.url} alt="image" style={{borderRadius: 12, maxWidth: "100%"}} />
                )
              ))
            ) : (
              <p className="message">{m.content}</p>
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{display: "flex", gap: 8, alignItems:"center", marginTop: 12}}>
        <input
          type="text"
          value={imgPrompt}
          onChange={(e) => setImgPrompt(e.target.value)}
          placeholder="Prompt for image generation (e.g., 'a cozy reading nook at sunset')"
          style={{flex: 1}}
        />
        <button className="primary" onClick={genImage}>Generate Image</button>
      </div>
    </main>
  );
}
