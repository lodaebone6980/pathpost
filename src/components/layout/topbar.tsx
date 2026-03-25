"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Menu, LogOut, Settings, Sparkles,
  Home, PenLine, FileText, ImagePlus, Eraser,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const MAIN_NAV = [
  { href: "/dashboard", label: "대시보드", icon: Home },
  { href: "/editor", label: "블로그 작성", icon: PenLine },
  { href: "/blog", label: "내 포스트", icon: FileText },
];

const TOOL_NAV = [
  { href: "/image", label: "이미지 생성", icon: ImagePlus },
  { href: "/crawl", label: "크롤링", icon: Eraser },
  { href: "/search", label: "논문 검색", icon: FileText },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "대시보드",
  "/editor": "블로그 작성",
  "/blog": "내 포스트",
  "/search": "논문 검색",
  "/papers": "논문 관리",
  "/crawl": "크롤링",
  "/image": "이미지 생성",
  "/settings": "설정",
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = PAGE_TITLES[pathname] || "PathPost";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("로그아웃 되었습니다");
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <Sheet>
        <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="flex h-14 items-center gap-2 px-6 border-b">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold">PathPost</span>
          </SheetTitle>
          <div className="py-4 px-3">
            <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase">메인</p>
            <nav className="space-y-1">
              {MAIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Separator />
          <div className="py-4 px-3">
            <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase">도구</p>
            <nav className="space-y-1">
              {TOOL_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Separator />
          <div className="p-3 space-y-1">
            <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent">
              <Settings className="h-4 w-4" /> 설정
            </Link>
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" /> 로그아웃
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
