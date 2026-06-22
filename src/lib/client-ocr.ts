"use client";

const MAX_EDGE = 1000;
const JPEG_QUALITY = 0.75;

async function compressImageFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("浏览器无法处理图片，请换 Chrome 或 Edge 重试");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) resolve(value);
        else reject(new Error("图片压缩失败，请换一张较小的截图"));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });

  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

/** 在浏览器本地识别截图文字，避免服务器 OCR 内存崩溃 */
export async function extractTextFromFiles(files: File[]): Promise<string[]> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("chi_sim", undefined, {
    logger: () => {},
  });
  const results: string[] = [];

  try {
    for (const file of files) {
      const compressed = await compressImageFile(file);
      const { data } = await worker.recognize(compressed);
      const text = data.text.trim();
      results.push(
        text.length > 0
          ? text
          : "（本张截图未能识别出有效文字，请结合上下文推断或说明信息不足）",
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "截图文字识别失败";
    throw new Error(
      `${message}。请确保网络正常（首次需下载中文语言包），或只上传 1 张较小截图后重试`,
    );
  } finally {
    await worker.terminate();
  }

  return results;
}
