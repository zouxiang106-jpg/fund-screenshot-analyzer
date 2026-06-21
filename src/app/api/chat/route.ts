import { buildChatSystemPrompt } from "@/lib/prompts";
import type { ChatRequestBody } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "服务器未配置 DEEPSEEK_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = (await request.json()) as ChatRequestBody;
    const { analysis, messages, question } = body;

    if (!analysis || !question?.trim()) {
      return new Response(JSON.stringify({ error: "缺少诊断数据或提问内容" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const chatMessages = [
      { role: "system" as const, content: buildChatSystemPrompt(analysis) },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: "user" as const, content: question.trim() },
    ];

    const deepseekResponse = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        stream: true,
        temperature: 0.5,
        max_tokens: 1500,
        thinking: { type: "disabled" },
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      return new Response(JSON.stringify({ error: errorText }), {
        status: deepseekResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!deepseekResponse.body) {
      return new Response(JSON.stringify({ error: "DeepSeek 未返回流式数据" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(deepseekResponse.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "追问失败，请稍后重试";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
