export type OcrProgress = { phase: string; percent: number };

const MAX_OCR_PAGES = 8;
const MAX_OCR_TEXT = 120_000;

/**
 * Runs OCR in the visitor's browser. The PDF pages are rendered locally and
 * sent to Tesseract; the original PDF is not uploaded to a third-party OCR API.
 */
export async function extractScannedPdfText(
  file: File,
  onProgress?: (progress: OcrProgress) => void,
): Promise<{ text: string; pagesProcessed: number }> {
  if (typeof window === "undefined") throw new Error("OCR is available in a browser only.");
  if (file.size > 20 * 1024 * 1024) throw new Error("This PDF is larger than the 20 MB OCR limit.");
  // Load browser-only engines on demand so Next.js doesn't evaluate them during SSR/build.
  const [pdfjs, tesseract] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("tesseract.js"),
  ]);
  const createWorker = tesseract.createWorker;
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data: bytes });
  let worker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | undefined;
  const chunks: string[] = [];
  try {
    const document = await loadingTask.promise;
    const pageCount = Math.min(document.numPages, MAX_OCR_PAGES);
    if (!pageCount) throw new Error("No pages were found in this PDF.");
    worker = await createWorker("eng", 1, {
      logger: (event) => {
        if (event.status === "recognizing text") {
          onProgress?.({ phase: "Recognizing text", percent: Math.round((event.progress || 0) * 100) });
        }
      },
    });
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      onProgress?.({ phase: `Reading page ${pageNumber} of ${pageCount}`, percent: Math.round(((pageNumber - 1) / pageCount) * 100) });
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare a page for OCR.");
      await page.render({ canvasContext: context, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
      const result = await worker.recognize(canvas);
      const text = String(result.data.text || "").trim();
      if (text) chunks.push(`[Page ${pageNumber}]\n${text}`);
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
      if (chunks.join("\n\n").length >= MAX_OCR_TEXT) break;
    }
    const text = chunks.join("\n\n").slice(0, MAX_OCR_TEXT).trim();
    if (!text) throw new Error("OCR could not recognize readable text in this PDF. Try a clearer scan or a PDF with selectable text.");
    onProgress?.({ phase: "OCR complete", percent: 100 });
    const pageLimitNote = document.numPages > MAX_OCR_PAGES
      ? `\n\n[OCR processed the first ${MAX_OCR_PAGES} of ${document.numPages} pages to keep processing manageable on mobile.]`
      : "";
    return { text: text + pageLimitNote, pagesProcessed: pageCount };
  } catch (error) {
    if (error instanceof Error && /OCR|browser|page|PDF/i.test(error.message)) throw error;
    throw new Error("OCR could not read this PDF. Check that it opens correctly, then try again.");
  } finally {
    if (worker) await worker.terminate().catch(() => undefined);
    await loadingTask.destroy().catch(() => undefined);
  }
}
