"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, FundAnalysis } from "@/lib/types";
import { createId } from "@/lib/id";

type FundChatProps = {
  analysis: FundAnalysis;
};

function createMessageId(): string {
  return createId();
}

async function readStreamResponse(
  response: Response,
  onDelta: (text: string) => void,
): Promise<string> {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("无法读取 AI 回复流");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      try {
        const parsed = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = parsed.choices?.[0]?.delta?.content;

        if (delta) {
          fullText += delta;
          onDelta(fullText);
        }
      } catch {
        // 忽略不完整 SSE 片段
      }
    }
  }

  return fullText;
}

export default function FundChat({ analysis }: FundChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const question = input.trim();
    if (!question || isStreaming) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: question,
    };

    const historyForApi = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          messages: historyForApi,
          question,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "追问失败，请稍后重试");
      }

      const assistantText = await readStreamResponse(response, setStreamingContent);

      if (!assistantText.trim()) {
        throw new Error("AI 未返回有效内容");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "assistant",
          content: assistantText,
        },
      ]);
      setStreamingContent("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "追问失败，请稍后重试";
      setError(message);
      setStreamingContent("");
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [analysis, input, isStreaming, messages]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <section className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-sky-500" />
        <h3 className="text-sm font-semibold tracking-wide text-slate-700 uppercase">
          个性化 AI 问答
        </h3>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
          <p className="text-sm text-slate-600">
            当前讨论：
            <span className="ml-1 font-semibold text-slate-800">
              {analysis.fundName}
            </span>
            <span className="ml-2 text-xs text-slate-400">
              {analysis.fundCode} · {analysis.decisionTag}
            </span>
          </p>
        </div>

        <div
          ref={scrollRef}
          className="max-h-80 min-h-[160px] space-y-4 overflow-y-auto px-5 py-4"
        >
          {messages.length === 0 && !isStreaming && (
            <div className="flex h-full min-h-[120px] flex-col items-center justify-center text-center">
              <p className="text-sm text-slate-500">
                例如：「我每月定投 500 元合适吗？」「已经亏了 10% 要割肉吗？」
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === "user"
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-100 bg-slate-50 text-slate-800"
                }`}
              >
                {message.role === "assistant" && (
                  <p className="mb-1 text-xs font-medium text-emerald-600">
                    AI 导师
                  </p>
                )}
                {message.content}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800">
                <p className="mb-1 text-xs font-medium text-emerald-600">
                  AI 导师
                </p>
                {streamingContent || (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" />
                  </span>
                )}
                {streamingContent && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-emerald-500 align-middle" />
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-rose-100 bg-rose-50 px-5 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="对这只基金还有疑问？在这里继续追问 AI 导师..."
              rows={1}
              disabled={isStreaming}
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isStreaming}
              aria-label="发送"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            按 Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </div>
    </section>
  );
}
