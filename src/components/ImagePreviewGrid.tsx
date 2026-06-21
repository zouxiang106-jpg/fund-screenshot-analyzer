"use client";

export type UploadedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type ImagePreviewGridProps = {
  images: UploadedImage[];
  maxImages: number;
  onRemove: (id: string) => void;
  onClearAll: () => void;
};

export default function ImagePreviewGrid({
  images,
  maxImages,
  onRemove,
  onClearAll,
}: ImagePreviewGridProps) {
  if (images.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">
          已选择{" "}
          <span className="text-emerald-600">{images.length}</span> / {maxImages}{" "}
          张截图
        </p>
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-full px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          清空全部
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.previewUrl}
              alt={`基金截图 ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/40 to-transparent px-2 py-1.5">
              <span className="text-xs font-medium text-white">
                截图 {index + 1}
              </span>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(image.id);
              }}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
              aria-label={`删除截图 ${index + 1}`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
