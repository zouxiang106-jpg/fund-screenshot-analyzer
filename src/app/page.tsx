"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AnalysisResult from "@/components/AnalysisResult";
import FundChat from "@/components/FundChat";
import ImagePreviewGrid, {
  type UploadedImage,
} from "@/components/ImagePreviewGrid";
import ImageUpload from "@/components/ImageUpload";
import { MAX_IMAGES } from "@/lib/constants";
import { createId } from "@/lib/id";
import type { AnalyzeApiResponse, FundAnalysis } from "@/lib/types";

function createUploadedImage(file: File): UploadedImage {
  return {
    id: `${file.name}-${file.lastModified}-${createId()}`,
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

export default function Home() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzePhase, setAnalyzePhase] = useState<"ocr" | "ai" | null>(null);
  const [analysis, setAnalysis] = useState<FundAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const runAnalysis = useCallback(async (targetImages: UploadedImage[]) => {
    if (targetImages.length === 0) return;

    const requestId = ++requestIdRef.current;
    setIsAnalyzing(true);
    setAnalyzePhase("ocr");
    setError(null);
    setAnalysis(null);

    try {
      const { extractTextFromFiles } = await import("@/lib/client-ocr");
      const ocrTexts = await extractTextFromFiles(
        targetImages.map((image) => image.file),
      );

      if (requestId !== requestIdRef.current) return;

      setAnalyzePhase("ai");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrTexts }),
      });

      if (!response.ok) {
        let message = "分析失败，请稍后重试";
        try {
          const data = (await response.json()) as AnalyzeApiResponse;
          if (!data.success) message = data.error;
        } catch {
          message = "服务器处理失败，可能内存不足，请减少截图张数后重试";
        }
        if (requestId !== requestIdRef.current) return;
        setError(message);
        return;
      }

      const result = (await response.json()) as AnalyzeApiResponse;

      if (requestId !== requestIdRef.current) return;

      if (!result.success) {
        setError(result.error);
        return;
      }

      setAnalysis(result.data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const message =
        err instanceof Error
          ? err.message
          : "连接中断，分析过程中请勿刷新页面";
      setError(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsAnalyzing(false);
        setAnalyzePhase(null);
      }
    }
  }, []);

  const handleImagesAdd = useCallback(
    (files: File[]) => {
      setImages((prev) => {
        const remaining = MAX_IMAGES - prev.length;

        if (remaining <= 0) {
          setError(`最多支持 ${MAX_IMAGES} 张截图，请先删除部分图片后再添加`);
          return prev;
        }

        const accepted = files.slice(0, remaining);

        if (files.length > remaining) {
          setError(
            `最多 ${MAX_IMAGES} 张，已添加 ${accepted.length} 张，其余 ${files.length - remaining} 张被跳过`,
          );
        } else {
          setError(null);
        }

        const newImages = accepted.map(createUploadedImage);
        const next = [...prev, ...newImages];
        return next;
      });
    },
    [runAnalysis],
  );

  const handleRemoveImage = useCallback(
    (id: string) => {
      setImages((prev) => {
        const target = prev.find((image) => image.id === id);
        if (target) URL.revokeObjectURL(target.previewUrl);

        const next = prev.filter((image) => image.id !== id);

        if (next.length === 0) {
          setAnalysis(null);
          setError(null);
          setIsAnalyzing(false);
        }

        return next;
      });
    },
    [runAnalysis],
  );

  const handleClearAll = useCallback(() => {
    requestIdRef.current += 1;
    setImages((prev) => {
      prev.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
    setAnalysis(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  const handleRetry = useCallback(() => {
    void runAnalysis(images);
  }, [images, runAnalysis]);

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [images]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-sky-200/20 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16 sm:px-8">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-white/70 px-4 py-1.5 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            基金截图智能分析 · DeepSeek
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            上传多张截图，获取 AI 投资建议
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500">
            把支付宝、天天基金或银行 App 里的多张基金截图传上来，AI
            导师会用大白话告诉你：该定投、持有还是逃跑。
          </p>
        </header>

        <div className="space-y-6">
          <ImageUpload
            onImagesAdd={handleImagesAdd}
            imageCount={images.length}
            maxImages={MAX_IMAGES}
          />
          <ImagePreviewGrid
            images={images}
            maxImages={MAX_IMAGES}
            onRemove={handleRemoveImage}
            onClearAll={handleClearAll}
          />

          {images.length > 0 && !isAnalyzing && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
              >
                开始 AI 分析（{images.length} 张）
              </button>
            </div>
          )}

          <AnalysisResult
            images={images}
            isAnalyzing={isAnalyzing}
            analyzePhase={analyzePhase}
            analysis={analysis}
            error={error}
            onRetry={handleRetry}
          />

          {analysis && (
            <FundChat
              key={`${analysis.fundCode}-${analysis.decisionTag}-${analysis.oneSentenceConclusion}`}
              analysis={analysis}
            />
          )}
        </div>

        <footer className="mt-12 text-center text-xs text-slate-400">
          分析结果仅供参考，不构成投资建议
        </footer>
      </main>
    </div>
  );
}
