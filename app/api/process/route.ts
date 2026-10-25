import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 20 * 1024 * 1024;

async function readPdf(file: File) {
  if (!file || file.size === 0) throw new Error("Please select a non-empty PDF.");
  if (file.size > MAX_BYTES) throw new Error("Each PDF must be 20 MB or smaller.");
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    throw new Error("Only PDF files are supported.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);
  const text = (parsed.text || "").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new Error("No selectable text was found. This may be a scanned PDF; OCR support is not connected yet.");
  return { name: file.name, pages: parsed.numpages || 0, text };
}

function sentencesOf(text: string) {
  return text.split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/).map(s => s.trim()).filter(s => s.length > 35);
}
function summarize(text: string) {
  const sentences = sentencesOf(text);
  const terms = text.toLowerCase().match(/[a-z]{4,}/g) || [];
  const freq = new Map<string, number>();
  for (const word of terms) if (!/^(that|this|with|from|have|were|been|will|would|could|should|their|there|which|when|where|about|into|than|then|also|such|more|most|some|many|each|they|them|your|document|section|page)$/.test(word)) freq.set(word, (freq.get(word) || 0) + 1);
  const ranked = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/[a-z]{4,}/g) || [];
    const score = words.reduce((sum, word) => sum + Math.min(freq.get(word) || 0, 5), 0) / Math.max(words.length, 1);
    return { sentence, index, score };
  }).sort((a,b) => b.score-a.score);
  const chosen = ranked.slice(0, Math.min(5, ranked.length)).sort((a,b)=>a.index-b.index).map(x=>x.sentence);
  const dates = [...new Set(text.match(/\b(?:\d{1,2}[/-]){1,2}\d{2,4}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi) || [])].slice(0,20);
  const amounts = [...new Set(text.match(/(?:[$£€₦]\s?\d[\d,.]*(?:\s?(?:million|billion|thousand|%))?|\b\d[\d,.]*\s?(?:percent|%)\b)/gi) || [])].slice(0,20);
  return { summary: chosen.length ? chosen : [text.slice(0, 800)], keyFindings: chosen.slice(0,3), dates, amounts, wordCount: (text.match(/\b[\w'-]+\b/g)||[]).length };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const action = String(form.get("action") || "analyze");
    if (action === "compare") {
      const first = form.get("file1");
      const second = form.get("file2");
      if (!(first instanceof File) || !(second instanceof File)) return NextResponse.json({ error: "Choose two PDFs to compare." }, { status: 400 });
      const [a,b] = await Promise.all([readPdf(first), readPdf(second)]);
      const aWords = new Set(a.text.toLowerCase().match(/\b[a-z0-9]{4,}\b/g) || []);
      const bWords = new Set(b.text.toLowerCase().match(/\b[a-z0-9]{4,}\b/g) || []);
      const common = [...aWords].filter(w=>bWords.has(w));
      const onlyA = [...aWords].filter(w=>!bWords.has(w)).slice(0,35);
      const onlyB = [...bWords].filter(w=>!aWords.has(w)).slice(0,35);
      const overlap = Math.round((common.length / Math.max(new Set([...aWords,...bWords]).size,1))*100);
      return NextResponse.json({ action, documents:[{name:a.name,pages:a.pages,words:aWords.size},{name:b.name,pages:b.pages,words:bWords.size}], overlap, sharedTerms:common.slice(0,40), uniqueToFirst:onlyA, uniqueToSecond:onlyB, note:"This first-pass comparison compares extracted vocabulary, not legal meaning or semantic equivalence." });
    }
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF first." }, { status: 400 });
    const doc = await readPdf(file);
    if (action === "chat") {
      const question = String(form.get("question") || "").trim();
      if (!question) return NextResponse.json({ error: "Enter a question about the PDF." }, { status: 400 });
      const queryTerms = (question.toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter(w=>!["what","when","where","which","does","this","that","with","from","have","about","tell","please","could","would"].includes(w));
      const matches = sentencesOf(doc.text).map((sentence,index)=>({sentence,index,score:queryTerms.reduce((n,w)=>n+(sentence.toLowerCase().includes(w)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
      return NextResponse.json({ action, document:doc.name, answer:matches.length ? matches.map(x=>x.sentence).join("\n\n") : "I couldn't find a clear passage matching that question in the selectable text of this PDF. Try using the document's own names or terms in your question.", matches:matches.length, disclaimer:"Answers currently use keyword-based retrieval from extracted PDF text. A connected language model and page-level citations are planned for a later stage." });
    }
    return NextResponse.json({ action:"analyze", document:{name:doc.name,pages:doc.pages}, ...summarize(doc.text), disclaimer:"This is an extractive first-pass analysis, not an AI-generated interpretation. Scanned PDFs require OCR, which is not connected yet." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process this PDF.";
    return NextResponse.json({ error:message }, { status:400 });
  }
}
