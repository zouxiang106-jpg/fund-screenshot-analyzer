import { NextResponse } from "next/server";
import { analyzeFromOcrTexts } from "@/lib/deepseek";
import { MAX_IMAGES } from "@/lib/constants";
import type { AnalyzeApiResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

type AnalyzeRequestBody = {
  ocrTexts?: unknown;
};

function parseOcrTexts(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const texts = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return texts.length > 0 ? texts : null;
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

    const body = (await request.json()) as AnalyzeRequestBody;
    const ocrTexts = parseOcrTexts(body.ocrTexts);

    if (!ocrTexts) {
      return NextResponse.json<AnalyzeApiResponse>(
        { success: false, error: "未收到有效的截图文字，请重新上传并分析" },
        { status: 400 },
      );
    }

    if (ocrTexts.length > MAX_IMAGES) {
      return NextResponse.json<AnalyzeApiResponse>(
        { success: false, error: `最多支持 ${MAX_IMAGES} 张截图` },
        { status: 400 },
      );
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
