import {
  FUND_MENTOR_SYSTEM_PROMPT,
  FUND_MENTOR_USER_PROMPT,
} from "@/lib/prompts";
import { extractTextFromImages, formatOcrForPrompt } from "@/lib/ocr";
import type { DecisionTag, FundAnalysis } from "@/lib/types";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const VALID_DECISION_TAGS: DecisionTag[] = [
  "坚定定投",
  "持基观望",
  "分批逃跑",
];

type ImageInput = {
  base64: string;
  mimeType: string;
};

function normalizeDecisionTag(value: unknown): DecisionTag | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (VALID_DECISION_TAGS.includes(trimmed as DecisionTag)) {
    return trimmed as DecisionTag;
  }

  if (trimmed.includes("定投")) return "坚定定投";
  if (trimmed.includes("观望") || trimmed.includes("持有")) return "持基观望";
  if (trimmed.includes("逃跑") || trimmed.includes("离场")) return "分批逃跑";

  return null;
}

function parseAnalysis(content: string): FundAnalysis {
  const parsed = JSON.parse(content) as Partial<FundAnalysis> & {
    diagnosticDetails?: Partial<FundAnalysis["diagnosticDetails"]>;
  };

  const decisionTag = normalizeDecisionTag(parsed.decisionTag);

  if (!decisionTag) {
    throw new Error("AI 返回的 decisionTag 格式不正确");
  }

  const details = (parsed.diagnosticDetails ?? {}) as Partial<
    FundAnalysis["diagnosticDetails"]
  >;

  return {
    fundName: parsed.fundName?.trim() || "未识别",
    fundCode: parsed.fundCode?.trim() || "未知",
    decisionTag,
    oneSentenceConclusion:
      parsed.oneSentenceConclusion?.trim() || "暂无核心结论",
    diagnosticDetails: {
      managerAnalysis: details.managerAnalysis?.trim() || "暂无经理分析",
      drawdownAnalysis: details.drawdownAnalysis?.trim() || "暂无回撤分析",
      trackValuation: details.trackValuation?.trim() || "暂无赛道估值分析",
    },
    actionSuggestions: Array.isArray(parsed.actionSuggestions)
      ? parsed.actionSuggestions.filter(Boolean).slice(0, 3)
      : [],
  };
}

export async function analyzeFundScreenshots(
  images: ImageInput[],
  apiKey: string,
  model: string,
): Promise<FundAnalysis> {
  const ocrTexts = await extractTextFromImages(images);
  return analyzeFromOcrTexts(ocrTexts, apiKey, model);
}

export async function analyzeFromOcrTexts(
  ocrTexts: string[],
  apiKey: string,
  model: string,
): Promise<FundAnalysis> {
  const ocrContent = formatOcrForPrompt(ocrTexts);

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: FUND_MENTOR_SYSTEM_PROMPT },
        {
          role: "user",
          content: `${FUND_MENTOR_USER_PROMPT(ocrTexts.length)}\n\n${ocrContent}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2500,
      thinking: { type: "disabled" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API 请求失败 (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("DeepSeek 未返回有效内容");
  }

  return parseAnalysis(content);
}
