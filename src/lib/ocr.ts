import path from "path";

type ImageInput = {
  base64: string;
  mimeType: string;
};

function getTesseractOptions() {
  const langPath = path.join(
    process.cwd(),
    "node_modules",
    "@tesseract.js-data",
    "chi_sim",
    "4.0.0",
  );

  return {
    langPath,
    cachePath: path.join(process.cwd(), ".tesseract-cache"),
    gzip: true,
  };
}

export async function extractTextFromImages(
  images: ImageInput[],
): Promise<string[]> {
  const { createWorker } = await import("tesseract.js");
  const tesseractOptions = getTesseractOptions();
  const results: string[] = [];

  for (let index = 0; index < images.length; index++) {
    const image = images[index];
    const buffer = Buffer.from(image.base64, "base64");
    const worker = await createWorker("chi_sim", undefined, tesseractOptions);

    try {
      const { data } = await worker.recognize(buffer);
      const text = data.text.trim();

      results.push(
        text.length > 0
          ? text
          : "（本张截图未能识别出有效文字，请结合上下文推断或说明信息不足）",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "OCR 识别失败";
      results.push(`（OCR 失败：${message}）`);
    } finally {
      await worker.terminate();
    }
  }

  return results;
}

export function formatOcrForPrompt(ocrTexts: string[]): string {
  return ocrTexts
    .map(
      (text, index) =>
        `========== 截图 ${index + 1}（OCR 文字识别） ==========\n${text}`,
    )
    .join("\n\n");
}
