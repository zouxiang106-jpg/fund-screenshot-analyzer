import sharp from "sharp";

/** 压缩截图，降低 OCR 内存占用（适合 2G/4G 服务器） */
export async function compressImageForOcr(buffer: Buffer): Promise<{
  base64: string;
  mimeType: string;
}> {
  const compressed = await sharp(buffer)
    .rotate()
    .resize({
      width: 1000,
      height: 1000,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 75 })
    .toBuffer();

  return {
    base64: compressed.toString("base64"),
    mimeType: "image/jpeg",
  };
}
