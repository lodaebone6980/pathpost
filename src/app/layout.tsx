import type { Metadata } from "next";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "PathPost 블로그 에디터",
  description: "AI 기반 의료 블로그 작성 플랫폼 - 의료 논문 검색 및 인용, 자동 블로그 생성",
  authors: [{ name: "PathPost" }],
  keywords: "블로그 작성,의료 블로그,AI 블로그,논문 검색,병원 블로그,의료 논문",
  openGraph: {
    title: "PathPost 블로그 에디터",
    description: "AI 기반 의료 블로그 작성 플랫폼 - 의료 논문 검색 및 인용, 자동 블로그 생성",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PathPost 블로그 에디터",
    description: "AI 기반 의료 블로그 작성 플랫폼",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          rel="stylesheet"
          href="https://hangeul.pstatic.net/hangeul_static/css/maru-buri.css"
        />
      </head>
      <body className="min-h-full flex flex-col font-pretendard">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster theme="system" richColors closeButton />
      </body>
    </html>
  );
}
