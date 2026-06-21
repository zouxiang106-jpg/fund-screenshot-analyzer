type ImageInput = {
  base64: string;
  mimeType: string;
};

export async function extractTextFromImages(
  images: ImageInput[],
): Promise<string[]> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("chi_sim+eng");

  try {
    const results: string[] = [];

    for (let index = 0; index < images.length; index++) {
      const image = images[index];
      const buffer = Buffer.from(image.base64, "base64");
      const { data } = await worker.recognize(buffer);
      const text = data.text.trim();

      results.push(
        text.length > 0
          ? text
          : "（本张截图未能识别出有效文字，请结合上下文推断或说明信息不足）",
      );
    }

    return results;
  } finally {
    await worker.terminate();
  }
}

export function formatOcrForPrompt(ocrTexts: string[]): string {
  return ocrTexts
    .map(
      (text, index) =>
        `========== 截图 ${index + 1}（OCR 文字识别） ==========\n${text}`,
    )
    .join("\n\n");
}
