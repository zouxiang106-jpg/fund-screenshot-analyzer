"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ImageUploadProps = {
  onImagesAdd: (files: File[]) => void;
  imageCount: number;
  maxImages: number;
};

function collectImageFiles(fileList: FileList | null): File[] {
  if (!fileList) return [];

  return Array.from(fileList).filter((file) => file.type.startsWith("image/"));
}

export default function ImageUpload({ onImagesAdd, imageCount, maxImages }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isFull = imageCount >= maxImages;

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (isFull) return;
      const files = collectImageFiles(fileList);
      if (files.length === 0) return;
      onImagesAdd(files);
    },
    [isFull, onImagesAdd],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (isFull) return;
      const items = event.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        event.preventDefault();
        onImagesAdd(pastedFiles);
      }
    },
    [isFull, onImagesAdd],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return (
    <div
      role="button"
      tabIndex={isFull ? -1 : 0}
      aria-disabled={isFull}
      onClick={() => !isFull && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (isFull) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(event) => {
        if (isFull) return;
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        if (isFull) return;
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        if (isFull) return;
        handleFiles(event.dataTransfer.files);
      }}
      className={`group relative flex min-h-[320px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-8 py-12 transition-all duration-300 outline-none ${
        isFull
          ? "cursor-not-allowed border-slate-200 bg-slate-50/80 opacity-70"
          : `cursor-pointer focus-visible:ring-4 focus-visible:ring-emerald-500/30 ${
              isDragging
                ? "scale-[1.01] border-emerald-500 bg-emerald-50/80 shadow-lg shadow-emerald-500/10"
                : "border-slate-300/80 bg-white/70 hover:border-emerald-400 hover:bg-white hover:shadow-xl hover:shadow-slate-200/60"
            }`
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl transition-colors duration-300 ${
          isDragging
            ? "bg-emerald-500 text-white"
            : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600"
        }`}
      >
        <svg
          className="h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-slate-800">
        {isFull
          ? `已达上限 ${maxImages} 张`
          : isDragging
            ? "松开即可上传"
            : imageCount > 0
              ? "继续添加截图"
              : "上传基金截图"}
      </h2>
      <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-slate-500">
        {isFull ? (
          <>请先删除部分截图，再继续添加</>
        ) : (
          <>
            支持一次选择或拖入多张图片（最多 {maxImages} 张）
            <br />
            也可以多次{" "}
            <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-600">
              Ctrl + V
            </kbd>{" "}
            粘贴截图
          </>
        )}
      </p>

      <p className="mt-6 text-xs text-slate-400">
        {isFull
          ? `当前 ${imageCount}/${maxImages} 张`
          : `支持 PNG、JPG、WEBP · 还可添加 ${maxImages - imageCount} 张`}
      </p>
    </div>
  );
}
