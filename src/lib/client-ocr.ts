"use client";

/** 在浏览器本地识别截图文字，避免服务器 OCR 内存崩溃 */
export async function extractTextFromFiles(files: File[]): Promise<string[]> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("chi_sim");
  const results: string[] = [];

  try {
    for (const file of files) {
      const { data } = await worker.recognize(file);
      const text = data.text.trim();
      results.push(
        text.length > 0
          ? text
          : "（本张截图未能识别出有效文字，请结合上下文推断或说明信息不足）",
      );
    }
  } finally {
    await worker.terminate();
  }

  return results;
}
