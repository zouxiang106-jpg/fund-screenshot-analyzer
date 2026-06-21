import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

export async function GET() {
  const hasApiKey = Boolean(process.env.DEEPSEEK_API_KEY?.trim());
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
  const envPath = path.join(process.cwd(), ".env.local");
  const envFileExists = fs.existsSync(envPath);

  return NextResponse.json({
    ok: hasApiKey,
    hasApiKey,
    model,
    envFileExists,
    cwd: process.cwd(),
    message: hasApiKey
      ? "服务正常，可以上传截图分析"
      : envFileExists
        ? ".env.local 存在但未读到 DEEPSEEK_API_KEY，请检查文件内容与编码（须 UTF-8）"
        : "缺少 .env.local，请在项目根目录创建并写入 DEEPSEEK_API_KEY",
  });
}
