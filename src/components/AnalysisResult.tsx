"use client";

import type { DecisionTag, FundAnalysis } from "@/lib/types";
import type { UploadedImage } from "@/components/ImagePreviewGrid";

type AnalysisResultProps = {
  images: UploadedImage[];
  isAnalyzing: boolean;
  analysis: FundAnalysis | null;
  error: string | null;
  onRetry: () => void;
};

const decisionStyles: Record<
  DecisionTag,
  { badge: string; ring: string; card: string; dot: string }
> = {
  坚定定投: {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ring: "ring-emerald-300",
    card: "bg-emerald-50/80 border-emerald-100",
    dot: "bg-emerald-500",
  },
  持基观望: {
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    ring: "ring-amber-300",
    card: "bg-amber-50/80 border-amber-100",
    dot: "bg-amber-500",
  },
  分批逃跑: {
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    ring: "ring-rose-300",
    card: "bg-rose-50/80 border-rose-100",
    dot: "bg-rose-500",
  },
};

const diagnosticLabels = [
  { key: "managerAnalysis" as const, title: "看经理", icon: "👤" },
  { key: "drawdownAnalysis" as const, title: "看回撤", icon: "📉" },
  { key: "trackValuation" as const, title: "看赛道 & 估值", icon: "🎯" },
];

export default function AnalysisResult({
  images,
  isAnalyzing,
  analysis,
  error,
  onRetry,
}: AnalysisResultProps) {
  const hasImages = images.length > 0;
  const styles = analysis ? decisionStyles[analysis.decisionTag] : null;

  return (
    <section className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <h3 className="text-sm font-semibold tracking-wide text-slate-700 uppercase">
          AI 诊断结果
        </h3>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
        {!hasImages ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-8 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-slate-600">
              上传多张截图后，AI 六维诊断结果将显示在这里
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              建议上传持仓页、收益页、基金详情等不同截图，便于 AI 综合判断
            </p>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            {isAnalyzing ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
                <p className="text-sm font-medium text-slate-600">
                  正在识别截图文字并调用 DeepSeek 分析（{images.length} 张）…
                </p>
                <p className="text-xs text-slate-400">
                  图片较多时可能需要 1～3 分钟，请稍候
                </p>
              </div>
            ) : error ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                >
                  重新分析
                </button>
              </div>
            ) : analysis && styles ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">
                      诊断标的
                    </p>
                    <h4 className="mt-1 text-xl font-bold text-slate-900">
                      {analysis.fundName}
                    </h4>
                    <p className="mt-0.5 text-sm text-slate-500">
                      代码：{analysis.fundCode}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-base font-bold ${styles.badge}`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
                    {analysis.decisionTag}
                  </span>
                </div>

                <div
                  className={`rounded-2xl border p-5 ring-2 ${styles.ring} ${styles.card}`}
                >
                  <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                    一句话结论
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-900">
                    {analysis.oneSentenceConclusion}
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium tracking-wider text-slate-500 uppercase">
                    六维诊断详情
                  </p>
                  <div className="grid gap-3">
                    {diagnosticLabels.map(({ key, title, icon }) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span>{icon}</span>
                          <span className="text-sm font-semibold text-slate-800">
                            {title}
                          </span>
                        </div>
                        <p className="text-sm leading-7 text-slate-700">
                          {analysis.diagnosticDetails[key]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {analysis.actionSuggestions.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-medium tracking-wider text-slate-500 uppercase">
                      行动建议
                    </p>
                    <ul className="space-y-2">
                      {analysis.actionSuggestions.map((suggestion, index) => (
                        <li
                          key={`${index}-${suggestion.slice(0, 12)}`}
                          className={`flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles.card}`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-slate-600">
                            {index + 1}
                          </span>
                          <span className="text-slate-800">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-slate-500">
                  已选择 {images.length} 张截图，点击下方按钮开始分析
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
