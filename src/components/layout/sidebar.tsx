"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Home, PenLine, FileText, ImagePlus, Eraser, Settings, LogOut, Sparkles, Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const MAIN_NAV = [
  { href: "/dashboard", label: "대시보드", icon: Home },
  { href: "/editor", label: "블로그 작성", icon: PenLine },
  { href: "/blog", label: "내 포스트", icon: FileText },
];

const TOOL_NAV = [
  { href: "/image", label: "이미지 생성", icon: ImagePlus },
  { href: "/image-wash", label: "이미지 워싱", icon: Wand2 },
  { href: "/crawl", label: "크롤링", icon: Eraser },
  { href: "/search", label: "논문 검색", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("로그아웃 되었습니다");
      router.push("/login");
    } catch {
      toast.error("로그아웃에 실패했습니다");
    }
  }

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">PathPost</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 py-4">
        <div className="px-3 mb-2">
          <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">메인</p>
          <nav className="space-y-1">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Separator className="my-3" />

        <div className="px-3">
          <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">이미지 도구</p>
          <nav className="space-y-1">
            {TOOL_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </ScrollArea>

      <Separator />
      <div className="p-3 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-primary text-primary-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
          )}
        >
          <Settings className="h-4 w-4" />
          설정
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-sm font-medium text-sidebar-foreground/70 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </aside>
  );
}
