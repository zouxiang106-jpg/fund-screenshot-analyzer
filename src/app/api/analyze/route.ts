import { NextResponse } from "next/server";
import { analyzeFromOcrTexts } from "@/lib/deepseek";
import { MAX_FILE_SIZE, MAX_IMAGES } from "@/lib/constants";
import { compressImageForOcr } from "@/lib/image";
import { extractTextFromImages } from "@/lib/ocr";
import type { AnalyzeApiResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

    if (!apiKey) {
      return NextResponse.json<AnalyzeApiResponse>(
        {
          success: false,
          error: "服务器未配置 DEEPSEEK_API_KEY，请在 .env.local 中设置",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const files = formData
      .getAll("images")
      .filter((item): item is File => item instanceof File);

    if (files.length === 0) {
      return NextResponse.json<AnalyzeApiResponse>(
        { success: false, error: "请至少上传一张基金截图" },
        { status: 400 },
      );
    }

    if (files.length > MAX_IMAGES) {
      return NextResponse.json<AnalyzeApiResponse>(
        { success: false, error: `最多支持上传 ${MAX_IMAGES} 张截图` },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (!isImageFile(file)) {
        return NextResponse.json<AnalyzeApiResponse>(
          { success: false, error: "仅支持上传图片文件" },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json<AnalyzeApiResponse>(
          { success: false, error: "单张图片不能超过 10MB" },
          { status: 400 },
        );
      }
    }

    const ocrTexts: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const compressed = await compressImageForOcr(buffer);
      const [text] = await extractTextFromImages([compressed]);
      ocrTexts.push(text);
    }

    const analysis = await analyzeFromOcrTexts(ocrTexts, apiKey, model);

    return NextResponse.json<AnalyzeApiResponse>({
      success: true,
      data: analysis,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "分析失败，请稍后重试";

    return NextResponse.json<AnalyzeApiResponse>(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
