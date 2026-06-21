import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "基金截图智能分析",
  description: "上传基金截图，AI 智能分析并给出投资建议",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
